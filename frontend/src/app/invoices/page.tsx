import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import InvoiceTable from "@/components/invoice/InvoiceTable";

export default function InvoicesPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <h1>Invoices</h1>
        <InvoiceTable />
      </AdminShell>
    </ProtectedRoute>
  );
}
