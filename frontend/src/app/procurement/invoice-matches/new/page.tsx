import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

import {
  InvoiceMatchForm,
} from "@/components/procurement/InvoiceMatchForm";

export default function NewInvoiceMatchPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="stack">
          <div>
            <p className="eyebrow">
              Procurement
            </p>

            <h1>
              New Invoice Match
            </h1>

            <p className="muted">
              Compare the Purchase Order,
              received goods, and vendor
              invoice.
            </p>
          </div>

          <InvoiceMatchForm />
        </div>
      </AdminShell>
    </ProtectedRoute>
  );
}
