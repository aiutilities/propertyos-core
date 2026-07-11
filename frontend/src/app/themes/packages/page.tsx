import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import ThemePackageTable from "@/components/theme/ThemePackageTable";

export default function ThemePackagesPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">Appearance</p>
            <h1>Theme Packages</h1>
            <p className="muted page-description">
              Review validated, installed, invalid and archived theme
              packages.
            </p>
          </div>

          <div className="page-header-actions">
            <Link
              className="secondary-button"
              href="/themes/packages/new"
            >
              Register Package
            </Link>

            <Link className="button-link" href="/themes">
              Installed Themes
            </Link>
          </div>
        </div>

        <ThemePackageTable />
      </AdminShell>
    </ProtectedRoute>
  );
}
