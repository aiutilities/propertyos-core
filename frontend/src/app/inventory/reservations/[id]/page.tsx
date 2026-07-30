"use client";

import { use } from "react";

import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

import InventoryReservationDetails from "@/components/inventory/InventoryReservationDetails";

export default function InventoryReservationDetailsPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = use(params);

  return (
    <ProtectedRoute>
      <AdminShell>
        <InventoryReservationDetails
          reservationId={id}
        />
      </AdminShell>
    </ProtectedRoute>
  );
}
