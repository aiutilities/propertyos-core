import {
  CommunicationStatus,
} from "@/types/communication";

export function CommunicationStatusBadge({
  status,
}: {
  status: CommunicationStatus;
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
