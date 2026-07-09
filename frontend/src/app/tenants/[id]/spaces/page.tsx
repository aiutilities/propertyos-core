import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import TenantSpacesTable from "@/components/tenant/TenantSpacesTable";

export default async function TenantSpacesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <h1>Assigned Spaces</h1>
          <a className="button-link" href={`/tenants/${id}/assign-space`}>
            Assign Space
          </a>
        </div>

        <TenantSpacesTable tenantId={id} />
      </AdminShell>
    </ProtectedRoute>
  );
}
