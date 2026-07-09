"use client";

import { use } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import { useTenant } from "@/hooks/useTenant";

export default function TenantDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { tenant, loading, error } = useTenant(id);

  return (
    <ProtectedRoute>
      <AdminShell>
        <h1>Tenant Details</h1>

        {loading && <p>Loading tenant...</p>}
        {error && <p>{error}</p>}

        {!loading && tenant && (
          <table className="table">
            <tbody>
              <tr>
                <th>Tenant Number</th>
                <td>{tenant.tenantNumber}</td>
              </tr>
              <tr>
                <th>Status</th>
                <td>{tenant.status}</td>
              </tr>
              <tr>
                <th>Person ID</th>
                <td>{tenant.personId}</td>
              </tr>
              <tr>
                <th>Property ID</th>
                <td>{tenant.propertyId}</td>
              </tr>
              <tr>
                <th>Move In</th>
                <td>{tenant.moveInDate ?? "-"}</td>
              </tr>
              <tr>
                <th>Move Out</th>
                <td>{tenant.moveOutDate ?? "-"}</td>
              </tr>
            </tbody>
          </table>
        )}
      </AdminShell>
    </ProtectedRoute>
  );
}
