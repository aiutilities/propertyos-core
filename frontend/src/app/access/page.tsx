import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import AccessDashboard from "@/components/access-control/AccessDashboard";
import { AdminShell } from "@/components/layout/AdminShell";

export default function AccessPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div>
          <p className="eyebrow">Operations</p>
          <h1>Access Control</h1>
        </div>

        <AccessDashboard />
      </AdminShell>
    </ProtectedRoute>
  );
}
