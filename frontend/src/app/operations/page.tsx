import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import OperationsHome from "@/components/operations/OperationsHome";

export default function OperationsPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">Platform Operations</p>
            <h1>Operations Center</h1>
          </div>
        </div>

        <OperationsHome />
      </AdminShell>
    </ProtectedRoute>
  );
}
