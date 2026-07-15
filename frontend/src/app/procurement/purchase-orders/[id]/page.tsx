import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

import {
  PurchaseOrderDetails,
} from "@/components/procurement/PurchaseOrderDetails";

export default async function PurchaseOrderDetailsPage({
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
        <PurchaseOrderDetails
          id={id}
        />
      </AdminShell>
    </ProtectedRoute>
  );
}
