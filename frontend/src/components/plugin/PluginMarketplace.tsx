"use client";

import {
  usePluginMarketplace,
} from "@/hooks/usePluginMarketplace";
import MarketplacePluginCard from "./MarketplacePluginCard";

export default function PluginMarketplace() {
  const {
    plugins,
    filters,
    total,
    loading,
    error,
    updateFilters,
    resetFilters,
    reload,
  } = usePluginMarketplace();

  const hasFilters =
    filters.query.trim() ||
    filters.category.trim() ||
    filters.tag.trim();

  return (
    <div className="marketplace-view">
      <section className="marketplace-toolbar">
        <div className="marketplace-filter-grid">
          <label>
            Search
            <input
              type="search"
              placeholder="Plugin name, provider or description"
              value={filters.query}
              onChange={(event) =>
                updateFilters({ query: event.target.value })
              }
            />
          </label>

          <label>
            Category
            <input
              placeholder="Example: Visitor"
              value={filters.category}
              onChange={(event) =>
                updateFilters({ category: event.target.value })
              }
            />
          </label>

          <label>
            Tag
            <input
              placeholder="Example: whatsapp"
              value={filters.tag}
              onChange={(event) =>
                updateFilters({ tag: event.target.value })
              }
            />
          </label>
        </div>

        <div className="marketplace-toolbar-actions">
          <button
            className="secondary-button"
            type="button"
            disabled={loading || !hasFilters}
            onClick={resetFilters}
          >
            Clear filters
          </button>

          <button
            className="secondary-button"
            type="button"
            disabled={loading}
            onClick={() => void reload()}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </section>

      <div className="marketplace-results-heading">
        <div>
          <h2>Marketplace catalogue</h2>
          <p className="muted">
            {loading
              ? "Loading marketplace plugins..."
              : `${total} plugin${total === 1 ? "" : "s"} found`}
          </p>
        </div>
      </div>

      {error ? <p className="error">{error}</p> : null}

      {!loading && !error && plugins.length === 0 ? (
        <div className="empty-state">
          <h2>
            {hasFilters
              ? "No marketplace plugins match these filters"
              : "Marketplace catalogue is empty"}
          </h2>

          <p>
            {hasFilters
              ? "Clear or change the search, category and tag filters."
              : "The backend marketplace registry currently contains no published plugins. Registered plugins will appear here automatically."}
          </p>
        </div>
      ) : null}

      {!loading && !error && plugins.length > 0 ? (
        <div className="marketplace-grid">
          {plugins.map((plugin) => (
            <MarketplacePluginCard
              key={plugin.id}
              plugin={plugin}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
