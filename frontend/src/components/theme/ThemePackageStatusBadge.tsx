import type { ThemePackageStatus } from "@/types/theme";

export default function ThemePackageStatusBadge({
  status,
}: {
  status: ThemePackageStatus;
}) {
  return (
    <span
      className={`theme-package-status theme-package-status-${status.toLowerCase()}`}
    >
      {status}
    </span>
  );
}
