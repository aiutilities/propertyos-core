import type {
  GoodsReceiptStatus,
} from "@/types/goodsReceipt";

export function GoodsReceiptStatusBadge({
  status,
}: {
  status: GoodsReceiptStatus;
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
