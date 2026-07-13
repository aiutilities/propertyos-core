"use client";

import { use } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import VisitorDetails from "@/components/visitor/VisitorDetails";

export default function VisitorDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <ProtectedRoute>
      <AdminShell>
        <VisitorDetails visitId={id} />
      </AdminShell>
    </ProtectedRoute>
  );
}
