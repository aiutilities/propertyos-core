"use client";

import { use } from "react";

import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

import InventoryTransferDetails from "@/components/inventory/InventoryTransferDetails";

export default function InventoryTransferDetailsPage({
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
        <InventoryTransferDetails
          transferId={id}
        />
      </AdminShell>
    </ProtectedRoute>
  );
}
