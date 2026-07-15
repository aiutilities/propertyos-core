import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

import {
  GoodsReceiptDetails,
} from "@/components/procurement/GoodsReceiptDetails";

export default async function GoodsReceiptDetailsPage({
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
        <GoodsReceiptDetails
          id={id}
        />
      </AdminShell>
    </ProtectedRoute>
  );
}
