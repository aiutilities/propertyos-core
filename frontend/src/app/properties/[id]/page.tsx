"use client";

import { use } from "react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import { useProperty } from "@/hooks/useProperty";

export default function PropertyDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { property, loading } = useProperty(id);

  return (
    <ProtectedRoute>
      <AdminShell>
        <h1>Property Details</h1>

        {loading && <p>Loading...</p>}

        {!loading && property && (
          <table className="table">
            <tbody>
              <tr>
                <th>Name</th>
                <td>{property.name}</td>
              </tr>
              <tr>
                <th>Code</th>
                <td>{property.code}</td>
              </tr>
              <tr>
                <th>Type</th>
                <td>{property.propertyType}</td>
              </tr>
              <tr>
                <th>City</th>
                <td>{property.city}</td>
              </tr>
              <tr>
                <th>Status</th>
                <td>{property.isActive ? "Active" : "Inactive"}</td>
              </tr>
            </tbody>
          </table>
        )}
      </AdminShell>
    </ProtectedRoute>
  );
}
