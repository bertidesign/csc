import { ActivateOrganization } from "@/components/activate-organization";
import { requireViewer } from "@/lib/auth";

export default async function ActivateOrganizationPage() {
  await requireViewer();
  return <ActivateOrganization />;
}
