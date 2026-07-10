"use client";

import { use } from "react";
import Link from "next/link";
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
        <div className="page-header">
          <h1>Property Details</h1>
          <Link className="button-link" href="/properties">
            Back to Properties
          </Link>
        </div>

        {loading && <p>Loading...</p>}

        {!loading && property && (
          <>
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

            <div className="actions">
              <Link
                className="button-link"
                href={`/properties/${property.id}/zones`}
              >
                View Zones
              </Link>
              <Link
                className="button-link"
                href={`/properties/${property.id}/spaces`}
              >
                View Spaces
              </Link>
              <Link
                className="button-link"
                href={`/properties/${property.id}/edit`}
              >
                Edit Property
              </Link>
            </div>
          </>
        )}
      </AdminShell>
    </ProtectedRoute>
  );
}
