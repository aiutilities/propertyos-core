import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

import HelpdeskForm from "@/components/helpdesk/HelpdeskForm";

export default function NewHelpdeskPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div>
          <p className="eyebrow">
            Helpdesk Operations
          </p>
          <h1>Create Helpdesk Ticket</h1>
        </div>

        <HelpdeskForm />
      </AdminShell>
    </ProtectedRoute>
  );
}
