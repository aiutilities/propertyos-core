import AccessEventHistory from "@/components/access-control/AccessEventHistory";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";

export default function AccessEventsPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div>
          <p className="eyebrow">Access Control</p>
          <h1>Access Events</h1>
        </div>

        <AccessEventHistory />
      </AdminShell>
    </ProtectedRoute>
  );
}
