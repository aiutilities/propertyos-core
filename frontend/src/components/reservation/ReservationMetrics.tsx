import {
  ReservationMetrics as Metrics,
} from "@/types/reservation";

export default function ReservationMetrics({
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
      "Pending",
      metrics?.pending ?? 0,
    ],
    [
      "Approved",
      metrics?.approved ?? 0,
    ],
    [
      "Upcoming",
      metrics?.upcoming ?? 0,
    ],
    [
      "Checked In",
      metrics?.checkedIn ?? 0,
    ],
    [
      "Completed",
      metrics?.completed ?? 0,
    ],
  ];

  return (
    <div className="metric-grid">
      {cards.map(
        ([label, value]) => (
          <article
            className="metric-card"
            key={label}
          >
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ),
      )}
    </div>
  );
}
