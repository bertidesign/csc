"use client";

import { useEffect, useRef } from "react";
import { useOrganizationList } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";

export function ActivateOrganization() {
  const { orgId } = useParams<{ orgId: string }>();
  const router = useRouter();
  const started = useRef(false);
  const { isLoaded, setActive, userMemberships } = useOrganizationList({
    userMemberships: { infinite: true },
  });

  useEffect(() => {
    if (!isLoaded || started.current) return;
    started.current = true;
    const isMember = userMemberships?.data?.some(({ organization }) => organization.id === orgId);
    if (!isMember) {
      router.replace("/dashboard?error=organization");
      return;
    }
    void setActive({ organization: orgId })
      .then(() => router.replace("/dashboard"))
      .catch(() => router.replace("/dashboard?error=organization"));
  }, [isLoaded, orgId, router, setActive, userMemberships]);

  return (
    <main className="activation-screen" aria-live="polite">
      <span className="brand-mark" aria-hidden="true">C</span>
      <p>Sto aprendo lo spazio di lavoro…</p>
    </main>
  );
}
