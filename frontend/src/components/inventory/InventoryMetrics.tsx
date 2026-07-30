import {
  InventoryDashboardMetrics,
} from "@/types/inventory";

function formatQuantity(
  value: number,
): string {
  return new Intl.NumberFormat(
    "en-IN",
    {
      maximumFractionDigits: 2,
    },
  ).format(value);
}

export default function InventoryMetrics({
  metrics,
}: {
  metrics: InventoryDashboardMetrics;
}) {
  const cards = [
    {
      label: "Inventory Items",
      value: metrics.totalItems,
    },
    {
      label: "Active Items",
      value: metrics.activeItems,
    },
    {
      label: "Stores",
      value: metrics.stores,
    },
    {
      label: "Stock Lines",
      value: metrics.stockLines,
    },
    {
      label: "On Hand",
      value: formatQuantity(
        metrics.totalOnHand,
      ),
    },
    {
      label: "Reserved",
      value: formatQuantity(
        metrics.totalReserved,
      ),
    },
    {
      label: "Available",
      value: formatQuantity(
        metrics.totalAvailable,
      ),
    },
    {
      label: "Unavailable Lines",
      value: metrics.belowReorderLines,
    },
  ];

  return (
    <div className="metric-grid">
      {cards.map((card) => (
        <article
          className="metric-card"
          key={card.label}
        >
          <span>{card.label}</span>
          <strong>{card.value}</strong>
        </article>
      ))}
    </div>
  );
}
