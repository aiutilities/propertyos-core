import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import ResidentMaintenanceForm from "@/components/resident/ResidentMaintenanceForm";

export default function ResidentMaintenanceNewPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div>
          <p className="eyebrow">Resident Portal</p>
          <h1>Raise Maintenance Complaint</h1>
        </div>

        <ResidentMaintenanceForm />
      </AdminShell>
    </ProtectedRoute>
  );
}
