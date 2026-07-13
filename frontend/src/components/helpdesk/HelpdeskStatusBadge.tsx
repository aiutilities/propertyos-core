import {
  HelpdeskStatus,
} from "@/types/helpdesk";

export function HelpdeskStatusBadge({
  status,
}: {
  status: HelpdeskStatus;
}) {
  return (
    <span
      className={[
        "status-badge",
        `status-${status
          .toLowerCase()
          .replaceAll("_", "-")}`,
      ].join(" ")}
    >
      {status.replaceAll(
        "_",
        " ",
      )}
    </span>
  );
}
