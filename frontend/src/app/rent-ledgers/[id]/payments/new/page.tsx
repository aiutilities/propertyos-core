"use client";

import { use } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import RentPaymentForm from "@/components/rent/RentPaymentForm";

export default function NewPaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <ProtectedRoute>
      <AdminShell>
        <h1>Post Rent Payment</h1>
        <RentPaymentForm rentLedgerId={id} />
      </AdminShell>
    </ProtectedRoute>
  );
}
