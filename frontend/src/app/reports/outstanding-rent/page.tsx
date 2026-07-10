import { Suspense } from "react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import OutstandingRentReport from "@/components/report/OutstandingRentReport";

export default function OutstandingRentReportPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <h1>Outstanding Rent Report</h1>
            <p className="page-description">
              Review unpaid and partially paid rent by
              property, tenant, due date and overdue age.
            </p>
          </div>
        </div>

        <Suspense
          fallback={
            <p>Loading outstanding rent report...</p>
          }
        >
          <OutstandingRentReport />
        </Suspense>
      </AdminShell>
    </ProtectedRoute>
  );
}
