import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getDb } from "@/db";
import { tenants } from "@/db/schema";

export async function getViewer() {
  const session = await auth();
  if (!session.userId) return null;

  const user = await currentUser();
  const primaryEmail = user?.primaryEmailAddress;
  const allowedEmails = (process.env.CSC_PLATFORM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return {
    userId: session.userId,
    orgId: session.orgId ?? null,
    orgRole: session.orgRole ?? null,
    email: primaryEmail?.emailAddress ?? null,
    isPlatformAdmin:
      primaryEmail?.verification?.status === "verified" &&
      allowedEmails.includes(primaryEmail.emailAddress.toLowerCase()),
  };
}

export async function requireViewer() {
  const viewer = await getViewer();
  if (!viewer) redirect("/sign-in");
  return viewer;
}

export async function requirePlatformAdmin() {
  const viewer = await requireViewer();
  if (!viewer.isPlatformAdmin) notFound();
  return viewer;
}

export async function requireTenantContext() {
  const viewer = await requireViewer();
  if (!viewer.orgId) {
    if (viewer.isPlatformAdmin) redirect("/admin/tenants");
    notFound();
  }

  const [tenant] = await getDb()
    .select()
    .from(tenants)
    .where(eq(tenants.clerkOrganizationId, viewer.orgId))
    .limit(1);

  if (!tenant) notFound();
  return { viewer, tenant };
}

export function getAppUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
