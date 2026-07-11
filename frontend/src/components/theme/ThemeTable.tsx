import ThemeRow from "./ThemeRow";
import type { Theme } from "@/types/theme";

export default function ThemeTable({
  themes,
}: {
  themes: Theme[];
}) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Version</th>
          <th>Author</th>
          <th>Status</th>
        </tr>
      </thead>

      <tbody>
        {themes.map((theme) => (
          <ThemeRow
            key={theme.id}
            theme={theme}
          />
        ))}
      </tbody>
    </table>
  );
}
