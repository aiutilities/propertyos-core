import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import ResidentVehicleList from "@/components/vehicle/ResidentVehicleList";

export default function ResidentVehiclesPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div>
          <p className="eyebrow">Resident Portal</p>
          <h1>My Vehicles</h1>
        </div>

        <ResidentVehicleList />
      </AdminShell>
    </ProtectedRoute>
  );
}
