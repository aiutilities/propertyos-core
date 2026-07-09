import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import LeaseTable from "@/components/lease/LeaseTable";

export default function LeasePage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <h1>Leases</h1>
        <LeaseTable />
      </AdminShell>
    </ProtectedRoute>
  );
}
