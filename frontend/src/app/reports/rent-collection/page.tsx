import { Suspense } from "react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import RentCollectionReport from "@/components/report/RentCollectionReport";

export default function RentCollectionReportPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <h1>Rent Collection Report</h1>
            <p className="page-description">
              Review collected rent by property, tenant, date and
              payment method.
            </p>
          </div>
        </div>

        <Suspense
          fallback={<p>Loading rent collection report...</p>}
        >
          <RentCollectionReport />
        </Suspense>
      </AdminShell>
    </ProtectedRoute>
  );
}
