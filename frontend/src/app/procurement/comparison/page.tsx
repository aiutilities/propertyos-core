import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

import {
  QuotationComparisonSelector,
} from "@/components/procurement/QuotationComparisonSelector";

export default function ComparisonPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <QuotationComparisonSelector />
      </AdminShell>
    </ProtectedRoute>
  );
}
