import Link from "next/link";

import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import CommunicationsDashboard from "@/components/communications/CommunicationsDashboard";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

export default function CommunicationsPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">
              Community Operations
            </p>
            <h1>Communications</h1>
          </div>

          <Link
            className="button-link"
            href="/communications/new"
          >
            Create Communication
          </Link>
        </div>

        <CommunicationsDashboard />
      </AdminShell>
    </ProtectedRoute>
  );
}
