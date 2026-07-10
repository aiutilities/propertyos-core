import Link from "next/link";
import { Suspense } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import ReceiptTable from "@/components/receipt/ReceiptTable";

export default function ReceiptsPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <h1>Receipts</h1>

          <Link className="button-link" href="/receipts/new">
            New Receipt
          </Link>
        </div>

        <Suspense fallback={<p>Loading receipts...</p>}>
          <ReceiptTable />
        </Suspense>
      </AdminShell>
    </ProtectedRoute>
  );
}
