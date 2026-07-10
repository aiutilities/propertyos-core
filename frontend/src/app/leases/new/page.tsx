import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import LeaseForm from "@/components/lease/LeaseForm";

export default function NewLeasePage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <h1>Create Lease</h1>
        <LeaseForm />
      </AdminShell>
    </ProtectedRoute>
  );
}
