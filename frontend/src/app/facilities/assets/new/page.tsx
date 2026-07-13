import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import AssetForm from "@/components/facility/AssetForm";

export default function NewFacilityAssetPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div>
          <p className="eyebrow">Facility Operations</p>
          <h1>Add Facility Asset</h1>
        </div>

        <AssetForm />
      </AdminShell>
    </ProtectedRoute>
  );
}
