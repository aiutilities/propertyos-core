import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import NotificationCenter from "@/components/notification/NotificationCenter";

export default function NotificationsPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">Operations Center</p>
            <h1>Notification Center</h1>
          </div>
        </div>

        <NotificationCenter />
      </AdminShell>
    </ProtectedRoute>
  );
}
