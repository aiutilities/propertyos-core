"use client";

import {
  use,
} from "react";

import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import CommunicationDetails from "@/components/communications/CommunicationDetails";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

export default function ResidentNoticeDetailsPage({
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
        <CommunicationDetails
          communicationId={id}
          residentMode
        />
      </AdminShell>
    </ProtectedRoute>
  );
}
