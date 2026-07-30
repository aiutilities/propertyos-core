"use client";

import { use } from "react";

import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

import StockAdjustmentDetails from "@/components/inventory/StockAdjustmentDetails";

export default function StockAdjustmentDetailsPage({
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
        <StockAdjustmentDetails
          adjustmentId={id}
        />
      </AdminShell>
    </ProtectedRoute>
  );
}
