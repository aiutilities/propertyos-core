"use client";

import { useThemeDetails } from "@/hooks/useThemeDetails";
import ThemeStatusBadge from "./ThemeStatusBadge";

type ThemeDetailsProps = {
  themeId: string;
};

function formatDate(value?: string) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function ThemeDetails({
  themeId,
}: ThemeDetailsProps) {
  const {
    theme,
    loading,
    error,
    actionError,
    activating,
    reload,
    activate,
  } = useThemeDetails(themeId);

  if (loading) {
    return <p>Loading theme details...</p>;
  }

  if (error) {
    return (
      <div className="theme-details-error">
        <p className="error">{error}</p>

        <button
          className="secondary-button"
          type="button"
          onClick={() => void reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!theme) {
    return (
      <div className="empty-state">
        <h2>Theme not found</h2>
        <p>The requested theme is unavailable.</p>
      </div>
    );
  }

  async function handleActivate() {
    if (!theme) {
      return;
    }

    const confirmed = window.confirm(
      `Activate ${theme.manifest.name}? ` +
        "The current theme will become inactive.",
    );

    if (!confirmed) {
      return;
    }

    await activate();
  }

  const branding = theme.manifest.branding;
  const layouts = theme.manifest.layouts ?? [];

  return (
    <div className="theme-details">
      <section className="theme-detail-card theme-detail-hero">
        <div>
          <p className="eyebrow">Installed Theme</p>
          <h2>{theme.manifest.name}</h2>
          <p className="theme-slug">{theme.manifest.id}</p>
          <p className="muted">
            {theme.manifest.description ??
              "No theme description provided."}
          </p>
        </div>

        <div className="theme-detail-status">
          <ThemeStatusBadge status={theme.status} />
          <span>Version {theme.manifest.version}</span>
        </div>
      </section>

      {actionError ? <p className="error">{actionError}</p> : null}

      <div className="theme-detail-grid">
        <section className="theme-detail-card">
          <h3>Theme information</h3>

          <dl className="plugin-definition-list">
            <div>
              <dt>Author</dt>
              <dd>{theme.manifest.author ?? "—"}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{theme.status}</dd>
            </div>
            <div>
              <dt>Installed</dt>
              <dd>{formatDate(theme.installedAt)}</dd>
            </div>
            <div>
              <dt>Activated</dt>
              <dd>{formatDate(theme.activatedAt)}</dd>
            </div>
          </dl>

          {theme.status !== "ACTIVE" ? (
            <button
              className="button-link theme-activate-button"
              type="button"
              disabled={activating}
              onClick={() => void handleActivate()}
            >
              {activating ? "Activating..." : "Activate Theme"}
            </button>
          ) : (
            <p className="theme-active-message">
              This is the active PropertyOS theme.
            </p>
          )}
        </section>

        <section className="theme-detail-card">
          <h3>Branding preview</h3>

          <div
            className="theme-branding-preview"
            style={{
              background:
                branding?.primaryColor ?? "#111827",
              color:
                branding?.secondaryColor ?? "#ffffff",
            }}
          >
            {branding?.logo ? (
              <img
                alt={`${theme.manifest.name} logo`}
                src={branding.logo}
              />
            ) : (
              <div className="theme-logo-placeholder">
                {theme.manifest.name.slice(0, 1).toUpperCase()}
              </div>
            )}

            <div>
              <strong>{theme.manifest.name}</strong>
              <span>PropertyOS theme preview</span>
            </div>
          </div>

          <dl className="plugin-definition-list">
            <div>
              <dt>Primary colour</dt>
              <dd>{branding?.primaryColor ?? "—"}</dd>
            </div>
            <div>
              <dt>Secondary colour</dt>
              <dd>{branding?.secondaryColor ?? "—"}</dd>
            </div>
            <div>
              <dt>Logo</dt>
              <dd>{branding?.logo ?? "—"}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="theme-detail-card">
        <h3>Supported layouts</h3>

        {layouts.length === 0 ? (
          <p className="muted">
            This theme does not declare any layouts.
          </p>
        ) : (
          <div className="theme-layout-list">
            {layouts.map((layout) => (
              <span key={layout}>{layout}</span>
            ))}
          </div>
        )}
      </section>

      <section className="theme-detail-card">
        <h3>Manifest</h3>

        <pre className="plugin-json">
          {JSON.stringify(theme.manifest, null, 2)}
        </pre>
      </section>
    </div>
  );
}
