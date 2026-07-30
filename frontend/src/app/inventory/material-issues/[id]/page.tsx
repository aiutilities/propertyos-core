"use client";

import { use } from "react";

import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

import InventoryMaterialIssueDetails from "@/components/inventory/InventoryMaterialIssueDetails";

export default function InventoryMaterialIssueDetailsPage({
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
        <InventoryMaterialIssueDetails
          issueId={id}
        />
      </AdminShell>
    </ProtectedRoute>
  );
}
