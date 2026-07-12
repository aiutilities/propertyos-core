import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import VehicleForm from "@/components/vehicle/VehicleForm";

export default function ResidentNewVehiclePage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div>
          <p className="eyebrow">Resident Portal</p>
          <h1>Register My Vehicle</h1>
        </div>

        <VehicleForm residentMode />
      </AdminShell>
    </ProtectedRoute>
  );
}
