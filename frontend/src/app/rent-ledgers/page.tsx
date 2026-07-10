import { Suspense } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import RentLedgerTable from "@/components/rent/RentLedgerTable";

export default function RentLedgersPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <h1>Rent Ledgers</h1>
        </div>

        <Suspense fallback={<p>Loading rent ledgers...</p>}>
          <RentLedgerTable />
        </Suspense>
      </AdminShell>
    </ProtectedRoute>
  );
}
