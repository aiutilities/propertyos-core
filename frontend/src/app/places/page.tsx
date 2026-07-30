import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

import PlacesWorkspace from "@/components/places/PlacesWorkspace";

export default function PlacesPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">
              Location Intelligence
            </p>
            <h1>Places</h1>
            <p className="muted-text">
              Search locations, discover
              nearby places, retrieve details
              and inspect runtime health.
            </p>
          </div>
        </div>

        <PlacesWorkspace />
      </AdminShell>
    </ProtectedRoute>
  );
}
