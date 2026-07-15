import type {
  InvoiceMatchStatus,
} from "@/types/invoiceMatch";

export function InvoiceMatchStatusBadge({
  status,
}: {
  status: InvoiceMatchStatus;
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
