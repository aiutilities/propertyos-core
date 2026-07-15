import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

import {
  GoodsReceiptForm,
} from "@/components/procurement/GoodsReceiptForm";

export default function NewGoodsReceiptPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="stack">
          <div>
            <p className="eyebrow">
              Procurement
            </p>

            <h1>
              New Goods Receipt
            </h1>

            <p className="muted">
              Record delivered, accepted,
              and rejected quantities.
            </p>
          </div>

          <GoodsReceiptForm />
        </div>
      </AdminShell>
    </ProtectedRoute>
  );
}
