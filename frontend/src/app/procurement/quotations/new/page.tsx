import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

import {
  QuotationForm,
} from "@/components/procurement/QuotationForm";

export default function NewQuotationPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="stack">
          <div>
            <p className="eyebrow">
              Procurement
            </p>

            <h1>
              New Vendor Quotation
            </h1>

            <p className="muted">
              Record pricing and commercial
              terms for an invited RFQ vendor.
            </p>
          </div>

          <QuotationForm />
        </div>
      </AdminShell>
    </ProtectedRoute>
  );
}
