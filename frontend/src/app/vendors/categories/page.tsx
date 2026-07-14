import {
  AdminShell,
} from "@/components/layout/AdminShell";

import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  VendorCategoriesList,
} from "@/components/vendor/VendorCategoriesList";

export default function VendorCategoriesPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <VendorCategoriesList />
      </AdminShell>
    </ProtectedRoute>
  );
}
