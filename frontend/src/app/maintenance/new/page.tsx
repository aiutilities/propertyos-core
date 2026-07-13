import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import MaintenanceForm from "@/components/maintenance/MaintenanceForm";

export default function NewMaintenancePage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div>
          <p className="eyebrow">Maintenance Operations</p>
          <h1>Create Maintenance Ticket</h1>
        </div>

        <MaintenanceForm />
      </AdminShell>
    </ProtectedRoute>
  );
}
