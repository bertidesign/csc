"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db";
import { tenants } from "@/db/schema";
import { requireTenantContext } from "@/lib/auth";

const brandInput = z.object({
  brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  logoUrl: z.string().trim().max(2048).refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return url.protocol === "https:" && !url.username && !url.password;
    } catch {
      return false;
    }
  }),
});

export async function updateBrandAction(formData: FormData) {
  const { tenant } = await requireTenantContext();
  const parsed = brandInput.safeParse({
    brandColor: formData.get("brandColor"),
    logoUrl: formData.get("logoUrl") ?? "",
  });
  if (!parsed.success) redirect("/settings?error=brand");

  await getDb()
    .update(tenants)
    .set({ brandColor: parsed.data.brandColor, logoUrl: parsed.data.logoUrl || null })
    .where(eq(tenants.id, tenant.id));

  revalidatePath("/dashboard");
  revalidatePath("/settings");
  redirect("/settings?saved=1");
}
