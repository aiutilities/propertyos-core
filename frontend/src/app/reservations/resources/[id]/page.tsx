"use client";

import {
  use,
} from "react";

import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";
import {
  AdminShell,
} from "@/components/layout/AdminShell";
import ReservationResourceDetails from "@/components/reservation/ReservationResourceDetails";

export default function ReservationResourceDetailsPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const {
    id,
  } = use(params);

  return (
    <ProtectedRoute>
      <AdminShell>
        <ReservationResourceDetails
          resourceId={id}
        />
      </AdminShell>
    </ProtectedRoute>
  );
}
