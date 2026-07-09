"use client";

import { use } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import AgreementVersionTable from "@/components/lease/AgreementVersionTable";
import { useLease } from "@/hooks/useLease";

export default function LeaseDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { lease, loading, error } = useLease(id);

  return (
    <ProtectedRoute>
      <AdminShell>
        <h1>Lease Details</h1>

        {loading && <p>Loading lease...</p>}
        {error && <p>{error}</p>}

        {!loading && lease && (
          <>
            <table className="table">
              <tbody>
                <tr>
                  <th>Agreement Number</th>
                  <td>{lease.leaseNumber}</td>
                </tr>
                <tr>
                  <th>Tenant ID</th>
                  <td>{lease.tenantId}</td>
                </tr>
                <tr>
                  <th>Status</th>
                  <td>{lease.status}</td>
                </tr>
                <tr>
                  <th>Current Version</th>
                  <td>{lease.currentVersionId ?? "-"}</td>
                </tr>
              </tbody>
            </table>

            <h2>Versions</h2>
            <AgreementVersionTable agreementId={lease.id} />
          </>
        )}
      </AdminShell>
    </ProtectedRoute>
  );
}
