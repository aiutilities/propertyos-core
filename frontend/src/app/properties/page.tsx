import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import PropertyTable from "@/components/property/PropertyTable";

export default function PropertiesPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <h1>Properties</h1>
        <PropertyTable />
      </AdminShell>
    </ProtectedRoute>
  );
}
