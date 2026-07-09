import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";

export default async function PropertyDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <ProtectedRoute>
      <AdminShell>
        <h1>Property Details</h1>
        <p>Property ID</p>
        <code>{id}</code>
      </AdminShell>
    </ProtectedRoute>
  );
}
