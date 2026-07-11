import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import SchedulerCenter from "@/components/scheduler/SchedulerCenter";

export default function SchedulerPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">Operations Center</p>
            <h1>Scheduler Center</h1>
          </div>
        </div>

        <SchedulerCenter />
      </AdminShell>
    </ProtectedRoute>
  );
}
