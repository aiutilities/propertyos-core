"use client";

import {
  use,
} from "react";

import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import HelpdeskDetails from "@/components/helpdesk/HelpdeskDetails";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

export default function ResidentHelpdeskDetailsPage({
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
        <HelpdeskDetails
          residentMode
          ticketId={id}
        />
      </AdminShell>
    </ProtectedRoute>
  );
}
