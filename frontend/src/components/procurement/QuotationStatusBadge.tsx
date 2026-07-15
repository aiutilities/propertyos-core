import type {
  QuotationStatus,
} from "@/types/quotation";

export function QuotationStatusBadge({
  status,
}: {
  status: QuotationStatus;
}) {
  return (
    <span
      className={`badge badge-${status
        .toLowerCase()
        .replaceAll("_", "-")}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
