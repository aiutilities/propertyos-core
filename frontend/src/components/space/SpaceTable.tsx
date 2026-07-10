"use client";

import { useSpaces } from "@/hooks/useSpaces";

export default function SpaceTable({
  propertyId,
}: {
  propertyId: string;
}) {
  const { spaces, loading, error } = useSpaces(propertyId);

  if (loading) return <p>Loading spaces...</p>;
  if (error) return <p>{error}</p>;

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Code</th>
          <th>Type</th>
          <th>Floor</th>
        </tr>
      </thead>

      <tbody>
        {spaces.map((space) => (
          <tr key={space.id}>
            <td>{space.name}</td>
            <td>{space.code}</td>
            <td>{space.spaceType}</td>
            <td>{space.floor}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
