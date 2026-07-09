import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import AssignSpaceForm from "@/components/tenant/AssignSpaceForm";

export default async function AssignSpacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <ProtectedRoute>
      <AdminShell>
        <h1>Assign Space</h1>
        <AssignSpaceForm tenantId={id} />
      </AdminShell>
    </ProtectedRoute>
  );
}
