import { MaintenanceMetrics as Metrics } from "@/types/maintenance";

export default function MaintenanceMetrics({
  metrics,
}: {
  metrics: Metrics | null;
}) {
  const cards = [
    ["Total", metrics?.total ?? 0],
    ["Open", metrics?.open ?? 0],
    ["Assigned", metrics?.assigned ?? 0],
    ["In Progress", metrics?.inProgress ?? 0],
    ["Overdue", metrics?.overdue ?? 0],
    ["Urgent", metrics?.urgent ?? 0],
  ];

  return (
    <div className="metric-grid">
      {cards.map(([label, value]) => (
        <article className="metric-card" key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </article>
      ))}
    </div>
  );
}
