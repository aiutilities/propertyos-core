import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import ReceiptForm from "@/components/receipt/ReceiptForm";

export default function NewReceiptPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <h1>Create Receipt</h1>

          <Link className="button-link" href="/receipts">
            Back to Receipts
          </Link>
        </div>

        <ReceiptForm />
      </AdminShell>
    </ProtectedRoute>
  );
}
