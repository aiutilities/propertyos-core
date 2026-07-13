import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import ResidentNoticeBoard from "@/components/communications/ResidentNoticeBoard";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

export default function ResidentNoticesPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div>
          <p className="eyebrow">
            Resident Portal
          </p>
          <h1>
            Community Notices
          </h1>
        </div>

        <ResidentNoticeBoard />
      </AdminShell>
    </ProtectedRoute>
  );
}
