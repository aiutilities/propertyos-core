import {
  AdminShell,
} from "@/components/layout/AdminShell";

import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  VendorDetails,
} from "@/components/vendor/VendorDetails";

export default async function VendorDetailPage({
  params,
}: {
  params:
    Promise<{
      id: string;
    }>;
}) {
  const {
    id,
  } = await params;

  return (
    <ProtectedRoute>
      <AdminShell>
        <VendorDetails
          vendorId={id}
        />
      </AdminShell>
    </ProtectedRoute>
  );
}
