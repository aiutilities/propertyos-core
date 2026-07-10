"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { RentPayment } from "@/types/payment";

export function useRentPayments(id: string) {
  const [payments, setPayments] = useState<RentPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<{ success: boolean; data: RentPayment[] }>(
      `/rent-ledgers/${id}/payments`,
    )
      .then((r) => setPayments(r.data))
      .finally(() => setLoading(false));
  }, [id]);

  return { payments, loading };
}
