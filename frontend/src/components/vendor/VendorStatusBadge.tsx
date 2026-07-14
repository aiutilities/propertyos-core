import type {
  VendorStatus,
} from "@/types/vendor";

const LABELS: Record<
  VendorStatus,
  string
> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
  BLOCKED: "Blocked",
  ARCHIVED: "Archived",
};

const CLASSES: Record<
  VendorStatus,
  string
> = {
  DRAFT: "badge",
  ACTIVE: "badge badge-success",
  SUSPENDED: "badge badge-warning",
  BLOCKED: "badge badge-danger",
  ARCHIVED: "badge",
};

export function VendorStatusBadge({
  status,
}: {
  status: VendorStatus;
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
