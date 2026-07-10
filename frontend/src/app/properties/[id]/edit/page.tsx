import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import PropertyForm from "@/components/property/PropertyForm";

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <ProtectedRoute>
      <AdminShell>
        <h1>Edit Property</h1>

        <PropertyForm propertyId={id} />
      </AdminShell>
    </ProtectedRoute>
  );
}
