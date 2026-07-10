import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import TenantForm from "@/components/tenant/TenantForm";

export default function NewTenantPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <h1>Create Tenant</h1>
        <TenantForm />
      </AdminShell>
    </ProtectedRoute>
  );
}
