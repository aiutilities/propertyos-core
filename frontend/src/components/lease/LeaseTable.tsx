"use client";

import { useLeases } from "@/hooks/useLeases";

export default function LeaseTable() {
  const { leases, loading, error } = useLeases();

  if (loading) return <p>Loading leases...</p>;
  if (error) return <p>{error}</p>;

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Lease / Agreement</th>
          <th>Tenant</th>
          <th>Current Version</th>
          <th>Status</th>
          <th>Created</th>
        </tr>
      </thead>

      <tbody>
        {leases.map((lease) => (
          <tr key={lease.id}>
            <td>{lease.leaseNumber}</td>
            <td>{lease.tenantId}</td>
            <td>{lease.currentVersionId ?? "-"}</td>
            <td>{lease.status}</td>
            <td>{lease.createdAt ?? "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
