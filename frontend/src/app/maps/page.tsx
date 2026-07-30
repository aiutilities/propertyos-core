import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

import MapsWorkspace from "@/components/maps/MapsWorkspace";

export default function MapsPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">
              Location Intelligence
            </p>
            <h1>Maps</h1>
            <p className="muted-text">
              Search addresses, inspect
              coordinates, calculate routes
              and verify Maps runtime health.
            </p>
          </div>
        </div>

        <MapsWorkspace />
      </AdminShell>
    </ProtectedRoute>
  );
}
