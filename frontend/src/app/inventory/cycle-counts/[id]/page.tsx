"use client";

import { use } from "react";

import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

import InventoryCycleCountDetails from "@/components/inventory/InventoryCycleCountDetails";

export default function InventoryCycleCountDetailsPage({
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
        <InventoryCycleCountDetails
          countId={id}
        />
      </AdminShell>
    </ProtectedRoute>
  );
}
