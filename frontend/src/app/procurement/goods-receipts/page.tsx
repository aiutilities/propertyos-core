import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

import {
  GoodsReceiptDashboard,
} from "@/components/procurement/GoodsReceiptDashboard";

export default function GoodsReceiptsPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <GoodsReceiptDashboard />
      </AdminShell>
    </ProtectedRoute>
  );
}
