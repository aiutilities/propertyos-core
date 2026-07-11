import Link from "next/link";
import ThemePackageStatusBadge from "./ThemePackageStatusBadge";
import type { ThemePackage } from "@/types/theme";

type ThemePackageRowProps = {
  themePackage: ThemePackage;
  busy: boolean;
  onInstall: (themePackage: ThemePackage) => Promise<void>;
  onArchive: (themePackage: ThemePackage) => Promise<void>;
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

export default function ThemePackageRow({
  themePackage,
  busy,
  onInstall,
  onArchive,
}: ThemePackageRowProps) {
  const canInstall =
    themePackage.status === "VALIDATED" ||
    themePackage.status === "REGISTERED";

  const canArchive =
    themePackage.status !== "ARCHIVED";

  return (
    <tr>
      <td>
        <div className="theme-package-name-cell">
          <strong>{themePackage.name}</strong>
          <span>{themePackage.manifest.id}</span>

          {themePackage.manifest.description ? (
            <p>{themePackage.manifest.description}</p>
          ) : null}
        </div>
      </td>

      <td>{themePackage.version}</td>
      <td>{themePackage.manifest.author ?? "—"}</td>

      <td>
        <ThemePackageStatusBadge status={themePackage.status} />
      </td>

      <td>{formatDate(themePackage.createdAt)}</td>

      <td>
        <div className="theme-package-actions">
          {canInstall ? (
            <button
              className="plugin-action plugin-action-primary"
              type="button"
              disabled={busy}
              onClick={() => void onInstall(themePackage)}
            >
              {busy ? "Working..." : "Install"}
            </button>
          ) : null}

          {themePackage.status === "INSTALLED" ? (
            <Link
              className="plugin-action plugin-action-link"
              href={`/themes/${themePackage.manifest.id}`}
            >
              View Theme
            </Link>
          ) : null}

          {canArchive ? (
            <button
              className="plugin-action plugin-action-danger"
              type="button"
              disabled={busy}
              onClick={() => void onArchive(themePackage)}
            >
              Archive
            </button>
          ) : null}
        </div>

        {themePackage.validationErrors.length > 0 ? (
          <details className="theme-package-errors">
            <summary>
              {themePackage.validationErrors.length} validation error
              {themePackage.validationErrors.length === 1 ? "" : "s"}
            </summary>

            <ul>
              {themePackage.validationErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </details>
        ) : null}
      </td>
    </tr>
  );
}
