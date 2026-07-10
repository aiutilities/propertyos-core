import Link from "next/link";
import { Suspense } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import PropertyTable from "@/components/property/PropertyTable";

export default function PropertiesPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <h1>Properties</h1>

          <Link className="button-link" href="/properties/new">
            New Property
          </Link>
        </div>

        <Suspense fallback={<p>Loading properties...</p>}>
          <PropertyTable />
        </Suspense>
      </AdminShell>
    </ProtectedRoute>
  );
}
