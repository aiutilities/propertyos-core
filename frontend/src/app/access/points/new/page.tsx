import AccessPointForm from "@/components/access-control/AccessPointForm";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";

export default function NewAccessPointPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div>
          <p className="eyebrow">Access Control</p>
          <h1>New Access Point</h1>
        </div>

        <AccessPointForm />
      </AdminShell>
    </ProtectedRoute>
  );
}
