import Link from "next/link";
import { Suspense } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import InvoiceTable from "@/components/invoice/InvoiceTable";
import { AdminShell } from "@/components/layout/AdminShell";

export default function InvoicesPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <h1>Invoices</h1>

          <Link className="button-link" href="/invoices/new">
            New Invoice
          </Link>
        </div>

        <Suspense fallback={<p>Loading invoices...</p>}>
          <InvoiceTable />
        </Suspense>
      </AdminShell>
    </ProtectedRoute>
  );
}
