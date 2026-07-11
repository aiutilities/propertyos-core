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
              Review the plugins installed in this PropertyOS deployment.
              Lifecycle actions will be available in the next milestone.
            </p>
          </div>
        </div>

        <PluginTable />
      </AdminShell>
    </ProtectedRoute>
  );
}
