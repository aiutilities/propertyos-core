"use client";

import { useZones } from "@/hooks/useZones";

export default function ZoneTable({
  propertyId,
}: {
  propertyId: string;
}) {
  const { zones, loading, error } = useZones(propertyId);

  if (loading) return <p>Loading zones...</p>;
  if (error) return <p>{error}</p>;

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Code</th>
          <th>Type</th>
          <th>Status</th>
        </tr>
      </thead>

      <tbody>
        {zones.map((zone) => (
          <tr key={zone.id}>
            <td>{zone.name}</td>
            <td>{zone.code}</td>
            <td>{zone.zoneType}</td>
            <td>{zone.isActive ? "Active" : "Inactive"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
