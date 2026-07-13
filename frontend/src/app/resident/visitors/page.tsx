import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import ResidentVisitorList from "@/components/resident/ResidentVisitorList";

export default function ResidentVisitorsPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">Resident Portal</p>
            <h1>My Visitors</h1>
          </div>

          <Link
            className="button-link"
            href="/resident/visitors/new"
          >
            Invite Visitor
          </Link>
        </div>

        <ResidentVisitorList />
      </AdminShell>
    </ProtectedRoute>
  );
}
