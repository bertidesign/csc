"use client";

import { useOrganizationList } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export function OrganizationSwitcher({ activeOrgId }: { activeOrgId: string }) {
  const router = useRouter();
  const { isLoaded, setActive, userMemberships } = useOrganizationList({
    userMemberships: { infinite: true },
  });
  const memberships = userMemberships?.data ?? [];

  if (!isLoaded || memberships.length < 2) return null;

  return (
    <label className="tenant-switcher">
      <span className="sr-only">Cambia spazio cliente</span>
      <select
        aria-label="Cambia spazio cliente"
        value={activeOrgId}
        onChange={(event) => {
          void setActive({ organization: event.target.value }).then(() => router.refresh());
        }}
      >
        {memberships.map(({ organization }) => (
          <option key={organization.id} value={organization.id}>
            {organization.name}
          </option>
        ))}
      </select>
    </label>
  );
}
