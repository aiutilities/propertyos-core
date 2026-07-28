import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import PropertyForm from "@/components/property/PropertyForm";

export default function NewPropertyPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="property-form-page">
          <header className="property-page-heading">
            <p className="eyebrow">
              Property portfolio
            </p>

            <h1>
              Create property
            </h1>

            <p>
              Establish the property record
              before adding zones, spaces,
              tenants and leases.
            </p>
          </header>

          <PropertyForm />
        </div>
      </AdminShell>
    </ProtectedRoute>
  );
}
