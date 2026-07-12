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
import ReservationDetails from "@/components/reservation/ReservationDetails";

export default function ReservationDetailsPage({
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
        <ReservationDetails
          reservationId={id}
        />
      </AdminShell>
    </ProtectedRoute>
  );
}
