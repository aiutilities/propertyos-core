import {
  HelpdeskPriority,
} from "@/types/helpdesk";

export function HelpdeskPriorityBadge({
  priority,
}: {
  priority: HelpdeskPriority;
}) {
  return (
    <span
      className={[
        "status-badge",
        `status-${priority.toLowerCase()}`,
      ].join(" ")}
    >
      {priority}
    </span>
  );
}
