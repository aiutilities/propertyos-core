import PluginStatusBadge from "./PluginStatusBadge";
import type { Plugin } from "@/types/plugin";

type PluginRowProps = {
  plugin: Plugin;
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

export default function PluginRow({ plugin }: PluginRowProps) {
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
    </tr>
  );
}
