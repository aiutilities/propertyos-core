import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import SpaceTable from "@/components/space/SpaceTable";

export default async function PropertySpacesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <ProtectedRoute>
      <AdminShell>
        <h1>Spaces</h1>
        <SpaceTable propertyId={id} />
      </AdminShell>
    </ProtectedRoute>
  );
}
