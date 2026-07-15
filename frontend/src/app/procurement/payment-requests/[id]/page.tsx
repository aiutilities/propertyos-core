import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

import {
  PaymentRequestDetails,
} from "@/components/procurement/PaymentRequestDetails";

export default async function PaymentRequestDetailsPage({
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
        <PaymentRequestDetails
          id={id}
        />
      </AdminShell>
    </ProtectedRoute>
  );
}
