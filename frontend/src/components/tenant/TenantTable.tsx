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
          <th>Name</th>
          <th>Email</th>
          <th>Phone</th>
          <th>Status</th>
        </tr>
      </thead>

      <tbody>
        {tenants.map((tenant) => (
          <tr key={tenant.id}>
            <td>{tenant.displayName}</td>
            <td>{tenant.email}</td>
            <td>{tenant.phone}</td>
            <td>{tenant.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
