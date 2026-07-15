import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

import {
  InvoiceMatchDetails,
} from "@/components/procurement/InvoiceMatchDetails";

export default async function InvoiceMatchDetailsPage({
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
        <InvoiceMatchDetails
          id={id}
        />
      </AdminShell>
    </ProtectedRoute>
  );
}
