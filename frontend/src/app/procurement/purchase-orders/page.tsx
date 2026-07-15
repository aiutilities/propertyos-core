import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

import {
  PurchaseOrderDashboard,
} from "@/components/procurement/PurchaseOrderDashboard";

export default function PurchaseOrdersPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <PurchaseOrderDashboard />
      </AdminShell>
    </ProtectedRoute>
  );
}
