import {
  Suspense,
} from "react";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  VendorWorkOrdersList,
} from "@/components/vendor/VendorWorkOrdersList";

export default function VendorWorkOrdersPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <Suspense
          fallback={
            <div className="panel">
              Loading work orders…
            </div>
          }
        >
          <VendorWorkOrdersList />
        </Suspense>
      </AdminShell>
    </ProtectedRoute>
  );
}
