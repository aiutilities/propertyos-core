import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import InvoiceTable from "@/components/invoice/InvoiceTable";

export default function InvoicesPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header"><h1>Invoices</h1><a className="button-link" href="/invoices/new">New Invoice</a></div>
        <InvoiceTable />
      </AdminShell>
    </ProtectedRoute>
  );
}
