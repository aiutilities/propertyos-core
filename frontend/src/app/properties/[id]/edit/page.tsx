import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import PropertyForm from "@/components/property/PropertyForm";

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const {
    id,
  } = await params;

  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="property-form-page">
          <header className="property-page-heading">
            <p className="eyebrow">
              Property portfolio
            </p>

            <h1>
              Edit property
            </h1>

            <p>
              Update the identity, type and
              physical location of this
              property.
            </p>
          </header>

          <PropertyForm
            propertyId={id}
          />
        </div>
      </AdminShell>
    </ProtectedRoute>
  );
}
