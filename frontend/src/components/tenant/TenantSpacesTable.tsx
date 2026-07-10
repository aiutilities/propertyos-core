"use client";

import { useTenantSpaces } from "@/hooks/useTenantSpaces";

export default function TenantSpacesTable({
  tenantId,
}: {
  tenantId: string;
}) {
  const { spaces, loading, error } = useTenantSpaces(tenantId);

  if (loading) return <p>Loading assigned spaces...</p>;
  if (error) return <p>{error}</p>;

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Space ID</th>
          <th>Assigned At</th>
          <th>Released At</th>
        </tr>
      </thead>

      <tbody>
        {spaces.map((space) => (
          <tr key={space.id}>
            <td>{space.spaceId}</td>
            <td>{space.assignedAt}</td>
            <td>{space.releasedAt ?? "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
