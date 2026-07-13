import type {
  VendorWorkOrderStatus,
} from "@/types/vendor";

const LABELS: Record<
  VendorWorkOrderStatus,
  string
> = {
  DRAFT: "Draft",
  ISSUED: "Issued",
  ACCEPTED: "Accepted",
  IN_PROGRESS: "In progress",
  ON_HOLD: "On hold",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REJECTED: "Rejected",
};

const CLASSES: Record<
  VendorWorkOrderStatus,
  string
> = {
  DRAFT: "badge",
  ISSUED: "badge badge-warning",
  ACCEPTED: "badge badge-success",
  IN_PROGRESS: "badge badge-success",
  ON_HOLD: "badge badge-warning",
  COMPLETED: "badge badge-success",
  CANCELLED: "badge",
  REJECTED: "badge badge-danger",
};

export function VendorWorkOrderStatusBadge({
  status,
}: {
  status: VendorWorkOrderStatus;
}) {
  return (
    <span
      className={
        CLASSES[status]
      }
    >
      {LABELS[status]}
    </span>
  );
}
