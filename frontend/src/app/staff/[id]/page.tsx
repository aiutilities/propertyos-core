"use client";

import { use } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import StaffDetails from "@/components/staff/StaffDetails";

export default function StaffDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <ProtectedRoute>
      <AdminShell>
        <StaffDetails staffId={id} />
      </AdminShell>
    </ProtectedRoute>
  );
}
