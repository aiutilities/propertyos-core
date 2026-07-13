import {
  CommunicationPriority,
} from "@/types/communication";

export function CommunicationPriorityBadge({
  priority,
}: {
  priority: CommunicationPriority;
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
