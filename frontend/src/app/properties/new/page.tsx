import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import PropertyForm from "@/components/property/PropertyForm";

export default function NewPropertyPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <h1>Create Property</h1>
        <PropertyForm />
      </AdminShell>
    </ProtectedRoute>
  );
}
