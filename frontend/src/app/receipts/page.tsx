import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import ReceiptTable from "@/components/receipt/ReceiptTable";

export default function ReceiptsPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <h1>Receipts</h1>
        <ReceiptTable />
      </AdminShell>
    </ProtectedRoute>
  );
}
