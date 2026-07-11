import type { MarketplacePluginStatus } from "@/types/plugin";

type MarketplaceStatusBadgeProps = {
  status: MarketplacePluginStatus;
};

export default function MarketplaceStatusBadge({
  status,
}: MarketplaceStatusBadgeProps) {
  return (
    <span
      className={`marketplace-status marketplace-status-${status
        .toLowerCase()
        .replaceAll("_", "-")}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
