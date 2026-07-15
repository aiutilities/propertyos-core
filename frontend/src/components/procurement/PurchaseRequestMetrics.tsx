import StatCard from "@/components/dashboard/StatCard";
import type { ProcurementMetrics } from "@/types/procurement";

export function PurchaseRequestMetrics({ metrics }: { metrics: ProcurementMetrics }) {
  return <div className="stats-grid">
    <StatCard title="Total requests" value={metrics.purchaseRequests.total} />
    <StatCard title="Pending approval" value={metrics.purchaseRequests.pendingApproval} />
    <StatCard title="Approved" value={metrics.purchaseRequests.approved} />
    <StatCard title="Rejected" value={metrics.purchaseRequests.rejected} />
  </div>;
}
