"use client";

import { use } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import VehicleDetails from "@/components/vehicle/VehicleDetails";

export default function VehicleDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <ProtectedRoute>
      <AdminShell>
        <VehicleDetails vehicleId={id} />
      </AdminShell>
    </ProtectedRoute>
  );
}
