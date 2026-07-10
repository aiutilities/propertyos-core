import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import RentLedgerForm from "@/components/rent/RentLedgerForm";

export default function NewRentLedgerPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <h1>Create Rent Ledger</h1>

          <Link className="button-link" href="/rent-ledgers">
            Back to Rent Ledgers
          </Link>
        </div>

        <RentLedgerForm />
      </AdminShell>
    </ProtectedRoute>
  );
}
