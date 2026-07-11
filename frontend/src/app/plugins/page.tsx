import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import PluginTable from "@/components/plugin/PluginTable";

export default function PluginsPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">Extensibility</p>
            <h1>Installed Plugins</h1>
            <p className="muted page-description">
              Review and manage the plugins installed in this
              PropertyOS deployment.
            </p>
          </div>

          <div className="page-header-actions">
            <Link
              className="secondary-button"
              href="/plugins/install"
            >
              Install ZIP
            </Link>

            <Link
              className="button-link"
              href="/plugins/marketplace"
            >
              Browse Marketplace
            </Link>
          </div>
        </div>

        <PluginTable />
      </AdminShell>
    </ProtectedRoute>
  );
}
