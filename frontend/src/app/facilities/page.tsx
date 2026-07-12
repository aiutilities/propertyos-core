import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import FacilityDashboard from "@/components/facility/FacilityDashboard";

export default function FacilitiesPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">Property Operations</p>
            <h1>Facilities & Assets</h1>
          </div>

          <div className="button-row">
            <Link
              className="secondary-button"
              href="/facilities/assets"
            >
              View Assets
            </Link>
            <Link
              className="button-link"
              href="/facilities/assets/new"
            >
              Add Asset
            </Link>
          </div>
        </div>

        <FacilityDashboard />
      </AdminShell>
    </ProtectedRoute>
  );
}
