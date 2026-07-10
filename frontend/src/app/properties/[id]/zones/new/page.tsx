import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import ZoneForm from "@/components/zone/ZoneForm";

export default async function NewZonePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <ProtectedRoute>
      <AdminShell>
        <h1>Create Zone</h1>

        <ZoneForm propertyId={id} />
      </AdminShell>
    </ProtectedRoute>
  );
}
