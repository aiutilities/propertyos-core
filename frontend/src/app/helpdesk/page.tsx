import Link from "next/link";

import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

import HelpdeskDashboard from "@/components/helpdesk/HelpdeskDashboard";

export default function HelpdeskPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">
              Service Operations
            </p>
            <h1>Helpdesk</h1>
          </div>

          <Link
            className="button-link"
            href="/helpdesk/new"
          >
            Create Ticket
          </Link>
        </div>

        <HelpdeskDashboard />
      </AdminShell>
    </ProtectedRoute>
  );
}
