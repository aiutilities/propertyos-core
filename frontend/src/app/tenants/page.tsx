import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import TenantTable from "@/components/tenant/TenantTable";

export default function TenantsPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <h1>Tenants</h1>
        <TenantTable />
      </AdminShell>
    </ProtectedRoute>
  );
}
