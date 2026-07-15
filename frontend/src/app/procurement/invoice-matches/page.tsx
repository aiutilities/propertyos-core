import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

import {
  InvoiceMatchDashboard,
} from "@/components/procurement/InvoiceMatchDashboard";

export default function InvoiceMatchesPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <InvoiceMatchDashboard />
      </AdminShell>
    </ProtectedRoute>
  );
}
