import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

import {
  PaymentRequestForm,
} from "@/components/procurement/PaymentRequestForm";

export default function NewPaymentRequestPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="stack">
          <div>
            <p className="eyebrow">
              Procurement
            </p>

            <h1>
              New Payment Request
            </h1>

            <p className="muted">
              Create a vendor payment
              request from an approved
              Invoice Match.
            </p>
          </div>

          <PaymentRequestForm />
        </div>
      </AdminShell>
    </ProtectedRoute>
  );
}
