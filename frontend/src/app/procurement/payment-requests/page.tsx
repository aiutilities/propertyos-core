import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

import {
  PaymentRequestDashboard,
} from "@/components/procurement/PaymentRequestDashboard";

export default function PaymentRequestsPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <PaymentRequestDashboard />
      </AdminShell>
    </ProtectedRoute>
  );
}
