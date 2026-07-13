import SecurityAccessEvaluator from "@/components/access-control/SecurityAccessEvaluator";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";

export default function SecurityAccessPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div>
          <p className="eyebrow">Security Operations</p>
          <h1>Access Evaluation</h1>
        </div>

        <SecurityAccessEvaluator />
      </AdminShell>
    </ProtectedRoute>
  );
}
