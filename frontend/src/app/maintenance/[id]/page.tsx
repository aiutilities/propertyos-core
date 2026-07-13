"use client";

import { use } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import MaintenanceDetails from "@/components/maintenance/MaintenanceDetails";

export default function MaintenanceDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <ProtectedRoute>
      <AdminShell>
        <MaintenanceDetails ticketId={id} />
      </AdminShell>
    </ProtectedRoute>
  );
}
