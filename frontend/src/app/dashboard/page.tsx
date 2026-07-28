import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import { AdminShell } from "@/components/layout/AdminShell";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <DashboardOverview />
      </AdminShell>
    </ProtectedRoute>
  );
}
