import type { PluginStatus } from "@/types/plugin";

type PluginStatusBadgeProps = {
  status: PluginStatus;
};

export default function PluginStatusBadge({
  status,
}: PluginStatusBadgeProps) {
  return (
    <span
      className={`plugin-status plugin-status-${status.toLowerCase()}`}
    >
      {status}
    </span>
  );
}
