import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import FacilityDashboard from "@/components/facility/FacilityDashboard";

export default function FacilityAssetsPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">Facility Operations</p>
            <h1>Asset Registry</h1>
          </div>

          <Link
            className="button-link"
            href="/facilities/assets/new"
          >
            Add Asset
          </Link>
        </div>

        <FacilityDashboard />
      </AdminShell>
    </ProtectedRoute>
  );
}
