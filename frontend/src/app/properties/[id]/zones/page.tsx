import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import ZoneTable from "@/components/zone/ZoneTable";

export default async function PropertyZonesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <ProtectedRoute>
      <AdminShell>
        <h1>Zones</h1>
        <ZoneTable propertyId={id} />
      </AdminShell>
    </ProtectedRoute>
  );
}
