import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import ThemeTable from "@/components/theme/ThemeTable";

export default function ThemesPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">Appearance</p>
            <h1>Themes</h1>
            <p className="muted page-description">
              Review installed themes and select the active appearance
              for this PropertyOS deployment.
            </p>
          </div>

          <Link
            className="button-link"
            href="/themes/packages"
          >
            Theme Packages
          </Link>
        </div>

        <ThemeTable />
      </AdminShell>
    </ProtectedRoute>
  );
}
