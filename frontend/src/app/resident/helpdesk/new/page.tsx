import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

import HelpdeskForm from "@/components/helpdesk/HelpdeskForm";

export default function ResidentNewHelpdeskPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div>
          <p className="eyebrow">
            Resident Portal
          </p>
          <h1>
            Raise Helpdesk Ticket
          </h1>
        </div>

        <HelpdeskForm residentMode />
      </AdminShell>
    </ProtectedRoute>
  );
}
