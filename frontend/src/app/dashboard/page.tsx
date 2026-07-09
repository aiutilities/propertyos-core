import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";

const cards = [
  ["Properties", "Create and manage properties, zones and spaces."],
  ["People", "Manage admins, occupants, vendors and visitors."],
  ["Plugins", "Install and configure business plugins."],
  ["Workflows", "Configure approvals, states and operational flows."],
];

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <section className="dashboard-grid">
          {cards.map(([title, description]) => (
            <article className="dashboard-card" key={title}>
              <h2>{title}</h2>
              <p>{description}</p>
            </article>
          ))}
        </section>
      </AdminShell>
    </ProtectedRoute>
  );
}
