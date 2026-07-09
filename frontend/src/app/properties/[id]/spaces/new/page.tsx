import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import SpaceForm from "@/components/space/SpaceForm";

export default async function NewSpacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <ProtectedRoute>
      <AdminShell>
        <h1>Create Space</h1>
        <SpaceForm propertyId={id} />
      </AdminShell>
    </ProtectedRoute>
  );
}
