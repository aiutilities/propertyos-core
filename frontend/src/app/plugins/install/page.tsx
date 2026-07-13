import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import PluginInstaller from "@/components/plugin/PluginInstaller";

export default function PluginInstallPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">Extensibility</p>
            <h1>Install Plugin</h1>
            <p className="muted page-description">
              Upload and install a PropertyOS plugin package without
              requiring server access.
            </p>
          </div>

          <Link className="button-link" href="/plugins">
            Installed Plugins
          </Link>
        </div>

        <PluginInstaller />
      </AdminShell>
    </ProtectedRoute>
  );
}
