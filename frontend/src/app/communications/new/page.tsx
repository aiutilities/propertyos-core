import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import CommunicationEditor from "@/components/communications/CommunicationEditor";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

export default function NewCommunicationPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div>
          <p className="eyebrow">
            Community Communications
          </p>
          <h1>
            Create Communication
          </h1>
        </div>

        <CommunicationEditor />
      </AdminShell>
    </ProtectedRoute>
  );
}
