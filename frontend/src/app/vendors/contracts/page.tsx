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
  VendorContractsList,
} from "@/components/vendor/VendorContractsList";

export default function VendorContractsPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <Suspense
          fallback={
            <div className="panel">
              Loading contracts…
            </div>
          }
        >
          <VendorContractsList />
        </Suspense>
      </AdminShell>
    </ProtectedRoute>
  );
}
