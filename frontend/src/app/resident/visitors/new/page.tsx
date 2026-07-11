import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import ResidentVisitorForm from "@/components/resident/ResidentVisitorForm";

export default function ResidentInviteVisitorPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div>
          <p className="eyebrow">Resident Portal</p>
          <h1>Invite Visitor</h1>
        </div>

        <ResidentVisitorForm />
      </AdminShell>
    </ProtectedRoute>
  );
}
