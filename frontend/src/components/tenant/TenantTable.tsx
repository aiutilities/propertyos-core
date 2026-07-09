"use client";

import { useTenants } from "@/hooks/useTenants";

export default function TenantTable() {
  const { tenants, loading, error } = useTenants();

  if (loading) return <p>Loading tenants...</p>;
  if (error) return <p>{error}</p>;

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Tenant Number</th>
          <th>Status</th>
          <th>Property ID</th>
          <th>Move In</th>
          <th>Move Out</th>
        </tr>
      </thead>

      <tbody>
        {tenants.map((tenant) => (
          <tr key={tenant.id}>
            <td>{tenant.tenantNumber}</td>
            <td>{tenant.status}</td>
            <td>{tenant.propertyId}</td>
            <td>{tenant.moveInDate ?? "-"}</td>
            <td>{tenant.moveOutDate ?? "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
