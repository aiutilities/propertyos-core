import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import VehicleForm from "@/components/vehicle/VehicleForm";

export default function NewVehiclePage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div>
          <p className="eyebrow">Vehicle Registry</p>
          <h1>Register Vehicle</h1>
        </div>

        <VehicleForm />
      </AdminShell>
    </ProtectedRoute>
  );
}
