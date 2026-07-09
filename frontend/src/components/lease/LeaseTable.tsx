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
          <th>Lease</th>
          <th>Tenant</th>
          <th>Property</th>
          <th>Rent</th>
          <th>Status</th>
        </tr>
      </thead>

      <tbody>
        {leases.map((lease) => (
          <tr key={lease.id}>
            <td>{lease.leaseNumber}</td>
            <td>{lease.tenantId}</td>
            <td>{lease.propertyId}</td>
            <td>{lease.monthlyRent}</td>
            <td>{lease.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
