import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import ResidentDashboard from "@/components/resident/ResidentDashboard";

export default function ResidentPortalPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">Resident Portal</p>
            <h1>My Home</h1>
          </div>
        </div>

        <ResidentDashboard />
      </AdminShell>
    </ProtectedRoute>
  );
}
