import Link from "next/link";
import { Suspense } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import LeaseTable from "@/components/lease/LeaseTable";

export default function LeasePage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <h1>Leases</h1>

          <Link className="button-link" href="/leases/new">
            New Lease
          </Link>
        </div>

        <Suspense fallback={<p>Loading leases...</p>}>
          <LeaseTable />
        </Suspense>
      </AdminShell>
    </ProtectedRoute>
  );
}
