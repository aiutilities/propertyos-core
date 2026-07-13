import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import VehicleDashboard from "@/components/vehicle/VehicleDashboard";

export default function VehiclesPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">Community Operations</p>
            <h1>Vehicle Registry</h1>
          </div>

          <Link className="button-link" href="/vehicles/new">
            Register Vehicle
          </Link>
        </div>

        <VehicleDashboard />
      </AdminShell>
    </ProtectedRoute>
  );
}
