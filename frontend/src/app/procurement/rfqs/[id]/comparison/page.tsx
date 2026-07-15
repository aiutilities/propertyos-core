import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

import {
  QuotationComparisonMatrix,
} from "@/components/procurement/QuotationComparisonMatrix";

export default async function RfqComparisonPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const {
    id,
  } = await params;

  return (
    <ProtectedRoute>
      <AdminShell>
        <QuotationComparisonMatrix
          rfqId={id}
        />
      </AdminShell>
    </ProtectedRoute>
  );
}
