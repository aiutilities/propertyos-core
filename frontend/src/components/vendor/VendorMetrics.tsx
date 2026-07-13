import type {
  VendorMetrics as VendorMetricsData,
} from "@/types/vendor";

export function VendorMetrics({
  metrics,
}: {
  metrics: VendorMetricsData;
}) {
  const cards = [
    {
      label: "Total vendors",
      value: metrics.total,
    },
    {
      label: "Active",
      value: metrics.active,
    },
    {
      label: "Draft",
      value: metrics.draft,
    },
    {
      label: "Suspended",
      value: metrics.suspended,
    },
    {
      label: "Blocked",
      value: metrics.blocked,
    },
    {
      label: "Open work orders",
      value: metrics.openWorkOrders,
    },
    {
      label: "Contracts expiring",
      value: metrics.contractsExpiring,
    },
    {
      label: "Compliance expiring",
      value: metrics.complianceExpiring,
    },
    {
      label: "Compliance expired",
      value: metrics.complianceExpired,
    },
  ];

  return (
    <section
      className="metric-grid"
      aria-label="Vendor metrics"
    >
      {cards.map(
        (card) => (
          <article
            className="metric-card"
            key={card.label}
          >
            <p className="muted">
              {card.label}
            </p>

            <strong>
              {card.value}
            </strong>
          </article>
        ),
      )}
    </section>
  );
}
