import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

import ResidentHelpdeskList from "@/components/helpdesk/ResidentHelpdeskList";

export default function ResidentHelpdeskPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">
              Resident Portal
            </p>
            <h1>
              My Helpdesk Tickets
            </h1>
          </div>
        </div>

        <ResidentHelpdeskList />
      </AdminShell>
    </ProtectedRoute>
  );
}
