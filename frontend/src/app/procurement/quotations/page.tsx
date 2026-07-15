import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

import {
  QuotationDashboard,
} from "@/components/procurement/QuotationDashboard";

export default function QuotationsPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <QuotationDashboard />
      </AdminShell>
    </ProtectedRoute>
  );
}
