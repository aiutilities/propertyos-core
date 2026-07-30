import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

import FormsManager from "@/components/forms/FormsManager";

export default function FormsPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">
              Structured Data
            </p>
            <h1>Forms</h1>
            <p className="muted-text">
              Define reusable forms,
              publish them and review
              submitted responses.
            </p>
          </div>
        </div>

        <FormsManager />
      </AdminShell>
    </ProtectedRoute>
  );
}
