import type {
  PurchaseOrderStatus,
} from "@/types/purchaseOrder";

export function PurchaseOrderStatusBadge({
  status,
}: {
  status: PurchaseOrderStatus;
}) {
  return (
    <span
      className={`badge badge-${status
        .toLowerCase()
        .replaceAll("_", "-")}`}
    >
      {status.replaceAll(
        "_",
        " ",
      )}
    </span>
  );
}
