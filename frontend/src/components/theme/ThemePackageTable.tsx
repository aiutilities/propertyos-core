"use client";

import { useMemo, useState } from "react";
import { useThemePackages } from "@/hooks/useThemePackages";
import type { ThemePackage } from "@/types/theme";
import ThemePackageRow from "./ThemePackageRow";

export default function ThemePackageTable() {
  const {
    packages,
    loading,
    error,
    actionError,
    busyPackageId,
    reload,
    install,
    archive,
  } = useThemePackages();

  const [search, setSearch] = useState("");

  const filteredPackages = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    if (!normalized) {
      return packages;
    }

    return packages.filter((themePackage) =>
      [
        themePackage.name,
        themePackage.version,
        themePackage.manifest.id,
        themePackage.manifest.name,
        themePackage.manifest.author,
        themePackage.manifest.description,
        themePackage.status,
        themePackage.sourcePath,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(normalized),
        ),
    );
  }, [packages, search]);

  async function handleInstall(themePackage: ThemePackage) {
    const confirmed = window.confirm(
      `Install theme package ${themePackage.name} version ` +
        `${themePackage.version}?`,
    );

    if (!confirmed) {
      return;
    }

    await install(themePackage);
  }

  async function handleArchive(themePackage: ThemePackage) {
    const confirmed = window.confirm(
      `Archive theme package ${themePackage.name}?`,
    );

    if (!confirmed) {
      return;
    }

    await archive(themePackage);
  }

  return (
    <div className="list-view">
      <div className="theme-toolbar">
        <label className="plugin-search">
          <span>Search theme packages</span>
          <input
            type="search"
            placeholder="Search by package, theme, author or status"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <button
          className="secondary-button"
          type="button"
          disabled={loading || busyPackageId !== null}
          onClick={() => void reload()}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {loading ? <p>Loading theme packages...</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {actionError ? <p className="error">{actionError}</p> : null}

      {!loading && !error && packages.length === 0 ? (
        <div className="empty-state">
          <h2>No theme packages registered</h2>
          <p>
            Registered theme packages will appear here. ZIP package upload
            will be connected in a later milestone.
          </p>
        </div>
      ) : null}

      {!loading &&
      !error &&
      packages.length > 0 &&
      filteredPackages.length === 0 ? (
        <div className="empty-state">
          <h2>No matching theme packages</h2>
          <p>Try another package name, author, version or status.</p>
        </div>
      ) : null}

      {!loading && !error && filteredPackages.length > 0 ? (
        <div className="table-scroll">
          <table className="table theme-package-table">
            <thead>
              <tr>
                <th>Package</th>
                <th>Version</th>
                <th>Author</th>
                <th>Status</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredPackages.map((themePackage) => (
                <ThemePackageRow
                  key={themePackage.id}
                  themePackage={themePackage}
                  busy={busyPackageId === themePackage.id}
                  onInstall={handleInstall}
                  onArchive={handleArchive}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
