"use client";

import { useProperties } from "@/hooks/useProperties";

export default function PropertyTable() {
  const { items, loading } = useProperties();

  if (loading) {
    return <p>Loading properties...</p>;
  }

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Code</th>
          <th>Type</th>
          <th>City</th>
          <th>Status</th>
        </tr>
      </thead>

      <tbody>
        {items.map((property) => (
          <tr key={property.id}>
            <td>{property.name}</td>
            <td>{property.code}</td>
            <td>{property.propertyType}</td>
            <td>{property.city ?? "-"}</td>
            <td>{property.isActive ? "Active" : "Inactive"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
