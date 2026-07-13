import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import QrValidationPanel from "@/components/security/QrValidationPanel";
import SecurityVisitorQueue from "@/components/security/SecurityVisitorQueue";

export default function SecurityDashboardPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">Security Operations</p>
            <h1>Gate Dashboard</h1>
          </div>
        </div>

        <QrValidationPanel />
        <SecurityVisitorQueue />
      </AdminShell>
    </ProtectedRoute>
  );
}
