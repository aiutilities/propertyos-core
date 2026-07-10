import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import InvoiceForm from "@/components/invoice/InvoiceForm";

export default function NewInvoicePage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <h1>Create Invoice</h1>
        <InvoiceForm />
      </AdminShell>
    </ProtectedRoute>
  );
}
