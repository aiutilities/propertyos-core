import type {
  VendorContractStatus,
} from "@/types/vendor";

const LABELS: Record<
  VendorContractStatus,
  string
> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  EXPIRED: "Expired",
  TERMINATED: "Terminated",
  RENEWED: "Renewed",
  CANCELLED: "Cancelled",
};

const CLASSES: Record<
  VendorContractStatus,
  string
> = {
  DRAFT: "badge",
  ACTIVE: "badge badge-success",
  EXPIRED: "badge badge-danger",
  TERMINATED: "badge badge-danger",
  RENEWED: "badge badge-success",
  CANCELLED: "badge",
};

export function VendorContractStatusBadge({
  status,
}: {
  status: VendorContractStatus;
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
