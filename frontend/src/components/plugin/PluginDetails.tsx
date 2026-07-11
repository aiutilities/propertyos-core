"use client";

import PluginStatusBadge from "./PluginStatusBadge";
import { usePluginDetails } from "@/hooks/usePluginDetails";

type PluginDetailsProps = {
  pluginId: string;
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

function countItems(value: unknown[] | undefined) {
  return Array.isArray(value) ? value.length : 0;
}

function JsonBlock({
  value,
  emptyMessage,
}: {
  value: unknown;
  emptyMessage: string;
}) {
  const isEmpty =
    value === undefined ||
    value === null ||
    (Array.isArray(value) && value.length === 0) ||
    (typeof value === "object" &&
      !Array.isArray(value) &&
      Object.keys(value as object).length === 0);

  if (isEmpty) {
    return <p className="muted">{emptyMessage}</p>;
  }

  return (
    <pre className="plugin-json">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export default function PluginDetails({
  pluginId,
}: PluginDetailsProps) {
  const {
    plugin,
    lifecycle,
    diagnostics,
    capabilities,
    loading,
    error,
    reload,
  } = usePluginDetails(pluginId);

  if (loading) {
    return <p>Loading plugin details...</p>;
  }

  if (error) {
    return (
      <div className="plugin-details-error">
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

  if (!plugin) {
    return (
      <div className="empty-state">
        <h2>Plugin not found</h2>
        <p>The requested installed plugin is unavailable.</p>
      </div>
    );
  }

  return (
    <div className="plugin-details">
      <section className="plugin-detail-card plugin-detail-hero">
        <div>
          <p className="eyebrow">Installed Plugin</p>
          <h2>{plugin.displayName}</h2>
          <p className="plugin-slug">{plugin.name}</p>
          <p className="muted">
            {plugin.description ?? "No plugin description provided."}
          </p>
        </div>

        <div className="plugin-detail-status">
          <PluginStatusBadge status={plugin.status} />
          <span>Version {plugin.version}</span>
        </div>
      </section>

      <div className="plugin-detail-grid">
        <section className="plugin-detail-card">
          <h3>Plugin information</h3>

          <dl className="plugin-definition-list">
            <div>
              <dt>Author</dt>
              <dd>{plugin.author ?? "—"}</dd>
            </div>
            <div>
              <dt>Minimum platform</dt>
              <dd>{plugin.manifest.minPlatformVersion ?? "—"}</dd>
            </div>
            <div>
              <dt>Installed</dt>
              <dd>{formatDate(plugin.installedAt)}</dd>
            </div>
            <div>
              <dt>Activated</dt>
              <dd>{formatDate(plugin.activatedAt)}</dd>
            </div>
            <div>
              <dt>Deactivated</dt>
              <dd>{formatDate(plugin.deactivatedAt)}</dd>
            </div>
          </dl>
        </section>

        <section className="plugin-detail-card">
          <h3>Lifecycle</h3>

          <dl className="plugin-definition-list">
            <div>
              <dt>Status</dt>
              <dd>{lifecycle?.status ?? plugin.status}</dd>
            </div>
            <div>
              <dt>Installed</dt>
              <dd>{formatDate(lifecycle?.installedAt)}</dd>
            </div>
            <div>
              <dt>Activated</dt>
              <dd>{formatDate(lifecycle?.activatedAt)}</dd>
            </div>
            <div>
              <dt>Deactivated</dt>
              <dd>{formatDate(lifecycle?.deactivatedAt)}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="plugin-detail-card">
        <h3>Registered capabilities</h3>

        <div className="plugin-capability-grid">
          <div>
            <strong>{countItems(capabilities?.permissions)}</strong>
            <span>Permissions</span>
          </div>
          <div>
            <strong>{countItems(capabilities?.workflows)}</strong>
            <span>Workflows</span>
          </div>
          <div>
            <strong>{countItems(capabilities?.notifications)}</strong>
            <span>Notifications</span>
          </div>
          <div>
            <strong>{countItems(capabilities?.documents)}</strong>
            <span>Documents</span>
          </div>
          <div>
            <strong>{countItems(capabilities?.configuration)}</strong>
            <span>Settings</span>
          </div>
          <div>
            <strong>{countItems(capabilities?.scheduler)}</strong>
            <span>Scheduler</span>
          </div>
          <div>
            <strong>{countItems(capabilities?.search)}</strong>
            <span>Search</span>
          </div>
        </div>
      </section>

      <div className="plugin-detail-grid">
        <section className="plugin-detail-card">
          <h3>Validation</h3>
          <JsonBlock
            value={diagnostics?.validation}
            emptyMessage="No validation information was reported."
          />
        </section>

        <section className="plugin-detail-card">
          <h3>Load report</h3>
          <JsonBlock
            value={diagnostics?.loadReport}
            emptyMessage="No plugin load events were reported."
          />
        </section>
      </div>

      {diagnostics?.error ? (
        <section className="plugin-detail-card">
          <h3>Runtime error</h3>
          <p className="error">{diagnostics.error}</p>
        </section>
      ) : null}

      <section className="plugin-detail-card">
        <h3>Manifest</h3>
        <JsonBlock
          value={plugin.manifest}
          emptyMessage="No plugin manifest is available."
        />
      </section>
    </div>
  );
}
