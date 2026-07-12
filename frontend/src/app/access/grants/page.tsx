import AccessGrantManager from "@/components/access-control/AccessGrantManager";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";

export default function AccessGrantsPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div>
          <p className="eyebrow">Access Control</p>
          <h1>Access Grants</h1>
        </div>

        <AccessGrantManager />
      </AdminShell>
    </ProtectedRoute>
  );
}
