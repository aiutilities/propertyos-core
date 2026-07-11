import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import VisitorForm from "@/components/visitor/VisitorForm";

export default function NewVisitorPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div>
          <p className="eyebrow">Visitor Operations</p>
          <h1>Invite Visitor</h1>
        </div>

        <VisitorForm />
      </AdminShell>
    </ProtectedRoute>
  );
}
