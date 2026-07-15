import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

import {
  ProcurementExecutiveDashboard,
} from "@/components/procurement/ProcurementExecutiveDashboard";

export default function ProcurementDashboardPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <ProcurementExecutiveDashboard />
      </AdminShell>
    </ProtectedRoute>
  );
}
