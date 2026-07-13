import type {
  VendorWorkOrderPriority,
} from "@/types/vendor";

const CLASSES: Record<
  VendorWorkOrderPriority,
  string
> = {
  LOW: "badge",
  MEDIUM: "badge badge-warning",
  HIGH: "badge badge-danger",
  URGENT: "badge badge-danger",
};

export function VendorPriorityBadge({
  priority,
}: {
  priority: VendorWorkOrderPriority;
}) {
  return (
    <span
      className={
        CLASSES[priority]
      }
    >
      {priority}
    </span>
  );
}
