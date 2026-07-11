import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import ThemePackageForm from "@/components/theme/ThemePackageForm";

export default function NewThemePackagePage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">Appearance</p>
            <h1>Register Theme Package</h1>
            <p className="muted page-description">
              Create and validate a theme package manifest.
            </p>
          </div>

          <Link
            className="button-link"
            href="/themes/packages"
          >
            Theme Packages
          </Link>
        </div>

        <ThemePackageForm />
      </AdminShell>
    </ProtectedRoute>
  );
}
