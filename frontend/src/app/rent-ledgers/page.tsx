import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import RentLedgerTable from "@/components/rent/RentLedgerTable";

export default function RentLedgersPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <h1>Rent Ledgers</h1>
        <RentLedgerTable />
      </AdminShell>
    </ProtectedRoute>
  );
}
