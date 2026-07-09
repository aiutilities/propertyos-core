"use client";

import { useProperties } from "@/hooks/useProperties";
import PropertyRow from "./PropertyRow";

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
          <PropertyRow key={property.id} property={property} />
        ))}
      </tbody>
    </table>
  );
}
