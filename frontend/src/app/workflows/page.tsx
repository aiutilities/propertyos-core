import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import WorkflowCenter from "@/components/workflow/WorkflowCenter";

export default function WorkflowsPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">Operations Center</p>
            <h1>Workflow Center</h1>
          </div>
        </div>

        <WorkflowCenter />
      </AdminShell>
    </ProtectedRoute>
  );
}
