import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { NavLinks } from "@/components/nav-links";
import { OrganizationSwitcher } from "@/components/organization-switcher";
import type { tenants } from "@/db/schema";

type Tenant = typeof tenants.$inferSelect;

export function AppShell({
  children,
  tenant,
  orgId,
  isPlatformAdmin,
}: {
  children: ReactNode;
  tenant: Tenant | null;
  orgId?: string | null;
  isPlatformAdmin: boolean;
}) {
  const style = { "--tenant-color": tenant?.brandColor ?? "#103B4A" } as CSSProperties;

  return (
    <div className="console-shell" style={style}>
      <aside className="console-rail">
        <Link className="console-brand" href={tenant ? "/dashboard" : "/admin/tenants"}>
          <span className="brand-mark" aria-hidden="true">C</span>
          <span>CSC</span>
        </Link>

        <div className="tenant-summary">
          {tenant?.logoUrl ? (
            // The URL is validated as HTTPS when a tenant saves its brand settings.
            <img className="tenant-logo" src={tenant.logoUrl} alt="" referrerPolicy="no-referrer" />
          ) : (
            <span className="tenant-logo tenant-logo-fallback" aria-hidden="true">
              {(tenant?.name ?? "CS").slice(0, 2).toUpperCase()}
            </span>
          )}
          <span className="tenant-summary-text">
            <strong>{tenant?.name ?? "Area piattaforma"}</strong>
            <span>{tenant ? "Spazio cliente" : "Customer Satisfaction Collector"}</span>
          </span>
        </div>

        {tenant && orgId ? <OrganizationSwitcher activeOrgId={orgId} /> : null}
        <NavLinks isPlatformAdmin={isPlatformAdmin} />

        <div className="rail-footnote">
          <span className="weather-mark" aria-hidden="true" />
          <span>Ascolta e migliora</span>
        </div>
      </aside>

      <div className="console-content">
        <header className="console-topbar">
          <div className="topbar-context">
            <span className="context-dot" aria-hidden="true" />
            <span>{tenant?.name ?? "CSC · Piattaforma"}</span>
          </div>
          <UserButton />
        </header>
        <main className="console-main">{children}</main>
      </div>
    </div>
  );
}
