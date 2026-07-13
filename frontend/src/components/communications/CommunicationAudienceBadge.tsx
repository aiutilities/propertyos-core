import {
  CommunicationAudienceType,
} from "@/types/communication";

export function CommunicationAudienceBadge({
  audience,
}: {
  audience: CommunicationAudienceType;
}) {
  return (
    <span className="status-badge">
      {audience.replaceAll(
        "_",
        " ",
      )}
    </span>
  );
}
