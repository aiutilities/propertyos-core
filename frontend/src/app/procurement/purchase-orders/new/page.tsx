import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

import {
  PurchaseOrderForm,
} from "@/components/procurement/PurchaseOrderForm";

export default function NewPurchaseOrderPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="stack">
          <div>
            <p className="eyebrow">
              Procurement
            </p>

            <h1>
              New Purchase Order
            </h1>

            <p className="muted">
              Create a Purchase Order from
              an awarded vendor quotation.
            </p>
          </div>

          <PurchaseOrderForm />
        </div>
      </AdminShell>
    </ProtectedRoute>
  );
}
