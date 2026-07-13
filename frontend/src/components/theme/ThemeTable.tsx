"use client";

import { useMemo, useState } from "react";
import { useThemes } from "@/hooks/useThemes";
import type { Theme } from "@/types/theme";
import ThemeRow from "./ThemeRow";

export default function ThemeTable() {
  const {
    themes,
    loading,
    error,
    actionError,
    activatingThemeId,
    reload,
    activate,
  } = useThemes();

  const [search, setSearch] = useState("");

  const filteredThemes = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    if (!normalized) {
      return themes;
    }

    return themes.filter((theme) =>
      [
        theme.manifest.id,
        theme.manifest.name,
        theme.manifest.version,
        theme.manifest.author,
        theme.manifest.description,
        theme.status,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(normalized),
        ),
    );
  }, [search, themes]);

  async function handleActivate(theme: Theme) {
    const confirmed = window.confirm(
      `Activate ${theme.manifest.name}? ` +
        "The currently active theme will become inactive.",
    );

    if (!confirmed) {
      return;
    }

    await activate(theme);
  }

  return (
    <div className="list-view">
      <div className="theme-toolbar">
        <label className="plugin-search">
          <span>Search installed themes</span>
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
          disabled={loading || activatingThemeId !== null}
          onClick={() => void reload()}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {loading ? <p>Loading themes...</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {actionError ? <p className="error">{actionError}</p> : null}

      {!loading && !error && themes.length === 0 ? (
        <div className="empty-state">
          <h2>No themes installed</h2>
          <p>
            Installed PropertyOS themes will appear here. Theme package
            installation will be connected in the next milestone.
          </p>
        </div>
      ) : null}

      {!loading &&
      !error &&
      themes.length > 0 &&
      filteredThemes.length === 0 ? (
        <div className="empty-state">
          <h2>No matching themes</h2>
          <p>Try another name, author, version or status.</p>
        </div>
      ) : null}

      {!loading && !error && filteredThemes.length > 0 ? (
        <div className="table-scroll">
          <table className="table theme-table">
            <thead>
              <tr>
                <th>Theme</th>
                <th>Version</th>
                <th>Author</th>
                <th>Status</th>
                <th>Installed</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredThemes.map((theme) => (
                <ThemeRow
                  key={theme.id}
                  theme={theme}
                  busy={activatingThemeId === theme.id}
                  onActivate={handleActivate}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
