import Link from "next/link";
import ThemeStatusBadge from "./ThemeStatusBadge";
import type { Theme } from "@/types/theme";

type ThemeRowProps = {
  theme: Theme;
  busy: boolean;
  onActivate: (theme: Theme) => Promise<void>;
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

export default function ThemeRow({
  theme,
  busy,
  onActivate,
}: ThemeRowProps) {
  const active = theme.status === "ACTIVE";

  return (
    <tr className={active ? "theme-row-active" : undefined}>
      <td>
        <div className="theme-name-cell">
          <div className="theme-name-heading">
            <strong>
              <Link
                className="theme-detail-link"
                href={`/themes/${theme.id}`}
              >
                {theme.manifest.name}
              </Link>
            </strong>

            {active ? (
              <span className="theme-current-badge">
                Current theme
              </span>
            ) : null}
          </div>

          <span>{theme.manifest.id}</span>

          {theme.manifest.description ? (
            <p>{theme.manifest.description}</p>
          ) : null}
        </div>
      </td>

      <td>{theme.manifest.version}</td>
      <td>{theme.manifest.author ?? "—"}</td>

      <td>
        <ThemeStatusBadge status={theme.status} />
      </td>

      <td>{formatDate(theme.installedAt)}</td>

      <td>
        <div className="theme-row-actions">
          {active ? (
            <span className="theme-active-note">Active</span>
          ) : (
            <button
              className="plugin-action plugin-action-primary"
              type="button"
              disabled={busy || theme.status === "UNINSTALLED"}
              onClick={() => void onActivate(theme)}
            >
              {busy ? "Activating..." : "Activate"}
            </button>
          )}

          <Link
            className="plugin-action plugin-action-link"
            href={`/themes/${theme.id}`}
          >
            Details
          </Link>
        </div>
      </td>
    </tr>
  );
}
