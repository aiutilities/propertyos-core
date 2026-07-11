import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import PluginMarketplace from "@/components/plugin/PluginMarketplace";

export default function PluginMarketplacePage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">Extensibility</p>
            <h1>Plugin Marketplace</h1>
            <p className="muted page-description">
              Discover verified, community and commercial plugins for
              this PropertyOS deployment.
            </p>
          </div>

          <Link className="button-link" href="/plugins">
            Installed Plugins
          </Link>
        </div>

        <PluginMarketplace />
      </AdminShell>
    </ProtectedRoute>
  );
}
