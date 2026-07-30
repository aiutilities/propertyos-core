"use client";

import { use } from "react";

import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

import InventoryMaterialReturnDetails from "@/components/inventory/InventoryMaterialReturnDetails";

export default function InventoryMaterialReturnDetailsPage({
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
        <InventoryMaterialReturnDetails
          returnId={id}
        />
      </AdminShell>
    </ProtectedRoute>
  );
}
