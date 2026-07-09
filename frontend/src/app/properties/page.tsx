import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import PropertyTable from "@/components/property/PropertyTable";

export default function PropertiesPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header"><h1>Properties</h1><a className="button-link" href="/properties/new">New Property</a></div>
        <PropertyTable />
      </AdminShell>
    </ProtectedRoute>
  );
}
