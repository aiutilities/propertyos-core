import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import SecurityVehicleLookup from "@/components/vehicle/SecurityVehicleLookup";

export default function SecurityVehiclesPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div>
          <p className="eyebrow">Security Operations</p>
          <h1>Vehicle Gate Lookup</h1>
        </div>

        <SecurityVehicleLookup />
      </AdminShell>
    </ProtectedRoute>
  );
}
