import {
  AdminShell,
} from "@/components/layout/AdminShell";

import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  VendorForm,
} from "@/components/vendor/VendorForm";

export default function NewVendorPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="stack">
          <div>
            <p className="eyebrow">
              Procurement operations
            </p>

            <h1>
              Add Vendor
            </h1>

            <p className="muted">
              Register a vendor,
              contact, and service
              category.
            </p>
          </div>

          <VendorForm />
        </div>
      </AdminShell>
    </ProtectedRoute>
  );
}
