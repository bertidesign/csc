import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { requireTenantContext } from "@/lib/auth";

export default async function WorkspaceLayout({ children }: { children: ReactNode }) {
  const { tenant, viewer } = await requireTenantContext();
  return <AppShell tenant={tenant} orgId={viewer.orgId} isPlatformAdmin={viewer.isPlatformAdmin}>{children}</AppShell>;
}
