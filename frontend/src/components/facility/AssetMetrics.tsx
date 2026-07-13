import { FacilityMetrics } from "@/types/facility";

export default function AssetMetrics({
  metrics,
}: {
  metrics: FacilityMetrics | null;
}) {
  const cards = [
    ["Total Assets", metrics?.total ?? 0],
    ["Active", metrics?.active ?? 0],
    ["In Maintenance", metrics?.inMaintenance ?? 0],
    ["Out of Service", metrics?.outOfService ?? 0],
    ["Warranty Expiring", metrics?.warrantyExpiring ?? 0],
    ["Preventive Due", metrics?.preventiveDue ?? 0],
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
