import type { VisitorStatus } from "@/types/visitor";

const labels: Record<VisitorStatus, string> = {
  invited: "Invited",
  approved: "Approved",
  rejected: "Rejected",
  arrived: "Arrived",
  checked_in: "Checked In",
  checked_out: "Checked Out",
  cancelled: "Cancelled",
  expired: "Expired",
  completed: "Completed",
};

export default function VisitorStatusBadge({
  status,
}: {
  status: VisitorStatus;
}) {
  return (
    <span className={`status-badge status-${status}`}>
      {labels[status] ?? status}
    </span>
  );
}
