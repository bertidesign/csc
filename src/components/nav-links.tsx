"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Activity, Building2, ClipboardList, MessageSquareText, Settings } from "lucide-react";

const tenantLinks = [
  { href: "/dashboard", label: "Panoramica", icon: Activity },
  { href: "/surveys", label: "Survey", icon: ClipboardList },
  { href: "/responses", label: "Risposte", icon: MessageSquareText },
  { href: "/settings", label: "Impostazioni", icon: Settings },
];

export function NavLinks({ isPlatformAdmin }: { isPlatformAdmin: boolean }) {
  const pathname = usePathname();
  const links = isPlatformAdmin
    ? [...tenantLinks, { href: "/admin/tenants", label: "Clienti", icon: Building2 }]
    : tenantLinks;

  return (
    <nav className="console-nav" aria-label="Navigazione principale">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
        return (
          <Link
            key={href}
            href={href}
            className={`console-nav-link${active ? " is-active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
