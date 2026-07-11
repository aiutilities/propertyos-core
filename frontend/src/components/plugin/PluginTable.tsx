"use client";

import { useMemo, useState } from "react";
import { usePlugins } from "@/hooks/usePlugins";
import PluginRow from "./PluginRow";

export default function PluginTable() {
  const { plugins, loading, error, reload } = usePlugins();
  const [search, setSearch] = useState("");

  const filteredPlugins = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return plugins;
    }

    return plugins.filter((plugin) => {
      return [
        plugin.name,
        plugin.displayName,
        plugin.description,
        plugin.author,
        plugin.version,
        plugin.status,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(normalizedSearch),
        );
    });
  }, [plugins, search]);

  return (
    <div className="list-view">
      <div className="plugin-toolbar">
        <label className="plugin-search">
          <span>Search installed plugins</span>
          <input
            type="search"
            placeholder="Search by name, author, version or status"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <button
          className="secondary-button"
          type="button"
          disabled={loading}
          onClick={() => void reload()}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {loading ? <p>Loading installed plugins...</p> : null}
      {error ? <p className="error">{error}</p> : null}

      {!loading && !error && plugins.length === 0 ? (
        <div className="empty-state">
          <h2>No plugins installed</h2>
          <p>
            Installed PropertyOS plugins will appear here. Marketplace and
            ZIP installation will be added in the next v2.1 milestones.
          </p>
        </div>
      ) : null}

      {!loading &&
      !error &&
      plugins.length > 0 &&
      filteredPlugins.length === 0 ? (
        <div className="empty-state">
          <h2>No matching plugins</h2>
          <p>Try a different plugin name, author, version or status.</p>
        </div>
      ) : null}

      {!loading && !error && filteredPlugins.length > 0 ? (
        <div className="table-scroll">
          <table className="table plugin-table">
            <thead>
              <tr>
                <th>Plugin</th>
                <th>Version</th>
                <th>Author</th>
                <th>Status</th>
                <th>Installed</th>
              </tr>
            </thead>

            <tbody>
              {filteredPlugins.map((plugin) => (
                <PluginRow key={plugin.id} plugin={plugin} />
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
