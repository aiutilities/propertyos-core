"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { RentLedger } from "@/types/rent";

export function useRentLedger(id: string) {
  const [ledger, setLedger] = useState<RentLedger>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<{ success: boolean; data: RentLedger }>(
      `/rent-ledgers/${id}`,
    )
      .then((r) => setLedger(r.data))
      .finally(() => setLoading(false));
  }, [id]);

  return { ledger, loading };
}
