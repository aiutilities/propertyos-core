import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

import {
  QuotationDetails,
} from "@/components/procurement/QuotationDetails";

export default async function QuotationDetailsPage({
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
        <QuotationDetails
          id={id}
        />
      </AdminShell>
    </ProtectedRoute>
  );
}
