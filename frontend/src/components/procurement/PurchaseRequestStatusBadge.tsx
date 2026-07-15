import type { PurchaseRequestStatus } from "@/types/procurement";

export function PurchaseRequestStatusBadge({ status }: { status: PurchaseRequestStatus }) {
  return <span className={`badge badge-${status.toLowerCase().replaceAll("_", "-")}`}>{status.replaceAll("_", " ")}</span>;
}
