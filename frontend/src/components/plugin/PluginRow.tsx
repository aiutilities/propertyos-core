import PluginStatusBadge from "./PluginStatusBadge";
import type {
  PluginLifecycleAction,
} from "@/hooks/usePlugins";
import type { Plugin } from "@/types/plugin";

type PluginRowProps = {
  plugin: Plugin;
  busy: boolean;
  onTransition: (
    plugin: Plugin,
    action: PluginLifecycleAction,
  ) => Promise<void>;
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
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function PluginRow({
  plugin,
  busy,
  onTransition,
}: PluginRowProps) {
  const canActivate =
    plugin.status === "INSTALLED" ||
    plugin.status === "INACTIVE";

  const canDeactivate = plugin.status === "ACTIVE";

  const canUninstall =
    plugin.status !== "ACTIVE" &&
    plugin.status !== "UNINSTALLED";

  return (
    <tr>
      <td>
        <div className="plugin-name-cell">
          <strong>{plugin.displayName}</strong>
          <span>{plugin.name}</span>
          {plugin.description ? <p>{plugin.description}</p> : null}
        </div>
      </td>

      <td>{plugin.version}</td>
      <td>{plugin.author ?? "—"}</td>

      <td>
        <PluginStatusBadge status={plugin.status} />
      </td>

      <td>{formatDate(plugin.installedAt)}</td>

      <td>
        <div className="plugin-actions">
          {canActivate ? (
            <button
              className="plugin-action plugin-action-primary"
              type="button"
              disabled={busy}
              onClick={() => void onTransition(plugin, "ACTIVATE")}
            >
              {busy ? "Working..." : "Activate"}
            </button>
          ) : null}

          {canDeactivate ? (
            <button
              className="plugin-action"
              type="button"
              disabled={busy}
              onClick={() => void onTransition(plugin, "DEACTIVATE")}
            >
              {busy ? "Working..." : "Deactivate"}
            </button>
          ) : null}

          {canUninstall ? (
            <button
              className="plugin-action plugin-action-danger"
              type="button"
              disabled={busy}
              onClick={() => void onTransition(plugin, "UNINSTALL")}
            >
              Uninstall
            </button>
          ) : null}

          {plugin.status === "UNINSTALLED" ? (
            <span className="plugin-action-note">
              No actions available
            </span>
          ) : null}
        </div>
      </td>
    </tr>
  );
}
