import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import DashboardOverview from "@/components/dashboard/DashboardOverview";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <h1>Dashboard</h1>
        <DashboardOverview />
      </AdminShell>
    </ProtectedRoute>
  );
}
