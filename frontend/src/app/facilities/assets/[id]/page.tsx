"use client";

import { use } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import AssetDetails from "@/components/facility/AssetDetails";

export default function FacilityAssetDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <ProtectedRoute>
      <AdminShell>
        <AssetDetails assetId={id} />
      </AdminShell>
    </ProtectedRoute>
  );
}
