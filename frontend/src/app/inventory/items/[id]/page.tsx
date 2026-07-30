"use client";

import { use } from "react";

import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

import InventoryItemDetails from "@/components/inventory/InventoryItemDetails";

export default function InventoryItemDetailsPage({
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
        <InventoryItemDetails
          itemId={id}
        />
      </AdminShell>
    </ProtectedRoute>
  );
}
