import MarketplaceStatusBadge from "./MarketplaceStatusBadge";
import type { MarketplacePlugin } from "@/types/plugin";

type MarketplacePluginCardProps = {
  plugin: MarketplacePlugin;
};

function formatDownloads(downloads?: number) {
  if (downloads === undefined) {
    return "—";
  }

  return new Intl.NumberFormat("en-IN", {
    notation: downloads >= 1000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(downloads);
}

export default function MarketplacePluginCard({
  plugin,
}: MarketplacePluginCardProps) {
  const latestVersion =
    plugin.versions.find(
      (version) => version.version === plugin.latestVersion,
    ) ?? plugin.versions[0];

  return (
    <article className="marketplace-card">
      <div className="marketplace-card-heading">
        <div>
          <div className="marketplace-title-row">
            <h2>{plugin.name}</h2>

            {plugin.verified ? (
              <span
                className="verified-badge"
                title="Verified marketplace plugin"
              >
                Verified
              </span>
            ) : null}
          </div>

          <p className="marketplace-provider">
            By {plugin.provider}
          </p>
        </div>

        <MarketplaceStatusBadge status={plugin.status} />
      </div>

      <p className="marketplace-description">
        {plugin.description ?? "No plugin description provided."}
      </p>

      <div className="marketplace-meta-grid">
        <div>
          <span>Latest version</span>
          <strong>{plugin.latestVersion}</strong>
        </div>

        <div>
          <span>Installed</span>
          <strong>{plugin.installedVersion ?? "Not installed"}</strong>
        </div>

        <div>
          <span>Rating</span>
          <strong>
            {plugin.rating !== undefined
              ? `${plugin.rating.toFixed(1)} / 5`
              : "—"}
          </strong>
        </div>

        <div>
          <span>Downloads</span>
          <strong>{formatDownloads(plugin.downloads)}</strong>
        </div>
      </div>

      <div className="marketplace-tags">
        {plugin.category ? (
          <span className="marketplace-category">
            {plugin.category}
          </span>
        ) : null}

        {plugin.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>

      <div className="marketplace-version-info">
        <div>
          <span>Minimum PropertyOS</span>
          <strong>
            {latestVersion?.minimumPlatformVersion ?? "—"}
          </strong>
        </div>

        <div>
          <span>Available versions</span>
          <strong>{plugin.versions.length}</strong>
        </div>
      </div>

      {latestVersion?.changelog ? (
        <details className="marketplace-changelog">
          <summary>Latest changelog</summary>
          <p>{latestVersion.changelog}</p>
        </details>
      ) : null}

      <div className="marketplace-card-actions">
        {plugin.status === "INSTALLED" ? (
          <span className="marketplace-installed-note">
            Already installed
          </span>
        ) : null}

        {plugin.status === "UPDATE_AVAILABLE" ? (
          <span className="marketplace-update-note">
            Update available
          </span>
        ) : null}

        {plugin.status === "AVAILABLE" ? (
          <button
            className="plugin-action plugin-action-primary"
            type="button"
            disabled
            title="Marketplace installation will be connected in the next milestone."
          >
            Install
          </button>
        ) : null}

        {plugin.status === "INCOMPATIBLE" ? (
          <span className="marketplace-warning">
            Incompatible with this platform version
          </span>
        ) : null}

        {plugin.status === "DEPRECATED" ? (
          <span className="marketplace-warning">
            This plugin is deprecated
          </span>
        ) : null}
      </div>
    </article>
  );
}
