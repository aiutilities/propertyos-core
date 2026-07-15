import type {
  PaymentRequestStatus,
} from "@/types/paymentRequest";

export function PaymentRequestStatusBadge({
  status,
}: {
  status: PaymentRequestStatus;
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
