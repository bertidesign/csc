"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getDb } from "@/db";
import { tenants } from "@/db/schema";
import { getAppUrl, requirePlatformAdmin } from "@/lib/auth";

const tenantInput = z.object({ name: z.string().trim().min(2).max(100) });
const inviteInput = z.object({
  tenantId: z.string().uuid(),
  email: z.string().trim().email().max(254),
});

function slugFor(name: string) {
  const base = name
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72);
  return `${base || "tenant"}-${randomUUID().slice(0, 8)}`;
}

export async function createTenantAction(formData: FormData) {
  const { userId } = await requirePlatformAdmin();
  const parsed = tenantInput.safeParse({ name: formData.get("name") });
  if (!parsed.success) redirect("/admin/tenants?error=tenant");

  const client = await clerkClient();
  const organization = await client.organizations.createOrganization({
    name: parsed.data.name,
    createdBy: userId,
  });

  try {
    await getDb().insert(tenants).values({
      name: parsed.data.name,
      slug: slugFor(parsed.data.name),
      clerkOrganizationId: organization.id,
    });
  } catch (error) {
    await client.organizations.deleteOrganization(organization.id).catch(() => undefined);
    throw error;
  }

  revalidatePath("/admin/tenants");
  redirect("/admin/tenants?created=1");
}

export async function inviteTenantUserAction(formData: FormData) {
  const { userId } = await requirePlatformAdmin();
  const parsed = inviteInput.safeParse({
    tenantId: formData.get("tenantId"),
    email: formData.get("email"),
  });
  if (!parsed.success) redirect("/admin/tenants?error=invite");

  const [tenant] = await getDb()
    .select()
    .from(tenants)
    .where(eq(tenants.id, parsed.data.tenantId))
    .limit(1);
  if (!tenant) redirect("/admin/tenants?error=tenant-not-found");

  const client = await clerkClient();
  await client.organizations.createOrganizationInvitation({
    organizationId: tenant.clerkOrganizationId,
    inviterUserId: userId,
    emailAddress: parsed.data.email,
    role: "org:member",
    redirectUrl: `${getAppUrl()}/activate/${tenant.clerkOrganizationId}`,
  });

  revalidatePath("/admin/tenants");
  redirect("/admin/tenants?invited=1");
}
