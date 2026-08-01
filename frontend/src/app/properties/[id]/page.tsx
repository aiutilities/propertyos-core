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
  const {
    property,
    loading,
    error,
    errorMessage,
    reload,
  } = useProperty(id);

  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <h1>Property Details</h1>

          <Link
            className="button-link"
            href="/properties"
          >
            Back to Properties
          </Link>
        </div>

        {loading ? (
          <main
            className="center-screen"
            aria-live="polite"
          >
            Loading property...
          </main>
        ) : null}

        {!loading && error ? (
          <section
            className="empty-state"
            role="alert"
          >
            <h2>Unable to load property</h2>

            <p>{errorMessage}</p>

            {error.requestId ? (
              <p className="muted">
                Reference: {error.requestId}
              </p>
            ) : null}

            {error.retryable ? (
              <button
                type="button"
                onClick={reload}
              >
                Try again
              </button>
            ) : null}
          </section>
        ) : null}

        {!loading && !error && !property ? (
          <section className="empty-state">
            <h2>Property not found</h2>

            <p>
              The requested property could not be
              found or is no longer available.
            </p>

            <Link
              className="button-link"
              href="/properties"
            >
              View all properties
            </Link>
          </section>
        ) : null}

        {!loading && !error && property ? (
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
                  <td>
                    {property.isActive
                      ? "Active"
                      : "Inactive"}
                  </td>
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
        ) : null}
      </AdminShell>
    </ProtectedRoute>
  );
}
