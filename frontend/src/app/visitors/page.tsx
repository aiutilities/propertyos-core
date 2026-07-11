import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import VisitorTable from "@/components/visitor/VisitorTable";

export default function VisitorsPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">Visitor Operations</p>
            <h1>Visitors</h1>
          </div>

          <Link className="button-link" href="/visitors/new">
            Invite Visitor
          </Link>
        </div>

        <VisitorTable />
      </AdminShell>
    </ProtectedRoute>
  );
}
