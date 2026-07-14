import type {
  VendorComplianceStatus,
} from "@/types/vendor";

const LABELS: Record<
  VendorComplianceStatus,
  string
> = {
  PENDING: "Pending",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
  EXPIRED: "Expired",
  WAIVED: "Waived",
};

const CLASSES: Record<
  VendorComplianceStatus,
  string
> = {
  PENDING: "badge badge-warning",
  VERIFIED: "badge badge-success",
  REJECTED: "badge badge-danger",
  EXPIRED: "badge badge-danger",
  WAIVED: "badge",
};

export function VendorComplianceStatusBadge({
  status,
}: {
  status: VendorComplianceStatus;
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
