import Link from "next/link";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";

const reports = [
  {
    title: "Rent Collection",
    description:
      "Review tenant payments, receipt references, payment modes and collection totals.",
    href: "/reports/rent-collection",
    status: "Available",
  },
  {
    title: "Outstanding Rent",
    description:
      "Track unpaid and partially paid rent ledgers, balances, due dates and overdue days.",
    href: "/reports/outstanding-rent",
    status: "Available",
  },
];

export default function ReportsPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <h1>Operational Reports</h1>
            <p className="page-description">
              Review rent collections and outstanding balances across
              properties and tenants.
            </p>
          </div>
        </div>

        <div className="report-card-grid">
          {reports.map((report) => (
            <Link
              className="report-card"
              href={report.href}
              key={report.href}
            >
              <div className="report-card-heading">
                <h2>{report.title}</h2>
                <span className="report-status">
                  {report.status}
                </span>
              </div>

              <p>{report.description}</p>

              <span className="report-card-action">
                Open report →
              </span>
            </Link>
          ))}
        </div>
      </AdminShell>
    </ProtectedRoute>
  );
}
