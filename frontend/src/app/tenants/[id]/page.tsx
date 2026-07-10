"use client";

import { use } from "react";
import Link from "next/link";
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
        <div className="page-header">
          <h1>Tenant Details</h1>
          <Link className="button-link" href="/tenants">
            Back to Tenants
          </Link>
        </div>

        {loading && <p>Loading tenant...</p>}
        {error && <p className="error">{error}</p>}

        {!loading && tenant && (
          <>
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
                  <td>
                    <Link href={`/properties/${tenant.propertyId}`}>
                      {tenant.propertyId}
                    </Link>
                  </td>
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

            <div className="actions">
              <Link className="button-link" href={`/tenants/${tenant.id}/spaces`}>
                View Spaces
              </Link>
              <Link
                className="button-link"
                href={`/tenants/${tenant.id}/assign-space`}
              >
                Assign Space
              </Link>
            </div>
          </>
        )}
      </AdminShell>
    </ProtectedRoute>
  );
}
