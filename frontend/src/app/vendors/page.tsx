import {
  AdminShell,
} from "@/components/layout/AdminShell";

import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  VendorDashboard,
} from "@/components/vendor/VendorDashboard";

export default function VendorsPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <VendorDashboard />
      </AdminShell>
    </ProtectedRoute>
  );
}
