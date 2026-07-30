import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

import InventoryReservationForm from "@/components/inventory/InventoryReservationForm";

export default function NewInventoryReservationPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">
              Inventory Operations
            </p>
            <h1>New Stock Reservation</h1>
          </div>
        </div>

        <InventoryReservationForm />
      </AdminShell>
    </ProtectedRoute>
  );
}
