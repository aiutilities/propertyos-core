import {
  HelpdeskMetrics as Metrics,
} from "@/types/helpdesk";

export default function HelpdeskMetrics({
  metrics,
}: {
  metrics: Metrics | null;
}) {
  const cards = [
    [
      "Total",
      metrics?.total ?? 0,
    ],
    [
      "Open",
      metrics?.open ?? 0,
    ],
    [
      "Assigned",
      metrics?.assigned ?? 0,
    ],
    [
      "In Progress",
      metrics?.inProgress ?? 0,
    ],
    [
      "Escalated",
      metrics?.escalated ?? 0,
    ],
    [
      "Resolution Breached",
      metrics?.resolutionBreached ?? 0,
    ],
    [
      "Urgent",
      metrics?.urgent ?? 0,
    ],
  ];

  return (
    <div className="metric-grid">
      {cards.map(
        ([label, value]) => (
          <article
            className="metric-card"
            key={String(label)}
          >
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ),
      )}
    </div>
  );
}
