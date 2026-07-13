import type { ThemeStatus } from "@/types/theme";

export default function ThemeStatusBadge({
  status,
}: {
  status: ThemeStatus;
}) {
  return (
    <span className={`plugin-status plugin-status-${status.toLowerCase()}`}>
      {status}
    </span>
  );
}
