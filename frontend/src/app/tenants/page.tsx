import Link from "next/link";
import { Suspense } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import TenantTable from "@/components/tenant/TenantTable";

export default function TenantsPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <h1>Tenants</h1>

          <Link className="button-link" href="/tenants/new">
            New Tenant
          </Link>
        </div>

        <Suspense fallback={<p>Loading tenants...</p>}>
          <TenantTable />
        </Suspense>
      </AdminShell>
    </ProtectedRoute>
  );
}
