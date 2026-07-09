import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import LeaseTable from "@/components/lease/LeaseTable";

export default function LeasePage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header"><h1>Leases</h1><a className="button-link" href="/leases/new">New Lease</a></div>
        <LeaseTable />
      </AdminShell>
    </ProtectedRoute>
  );
}
