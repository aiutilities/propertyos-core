import Link from "next/link";
import ThemeStatusBadge from "./ThemeStatusBadge";
import type { Theme } from "@/types/theme";

export default function ThemeRow({ theme }: { theme: Theme }) {
  return (
    <tr>
      <td>
        <Link href={`/themes/${theme.id}`}>
          {theme.manifest.name}
        </Link>
      </td>
      <td>{theme.manifest.version}</td>
      <td>{theme.manifest.author ?? "-"}</td>
      <td>
        <ThemeStatusBadge status={theme.status} />
      </td>
    </tr>
  );
}
