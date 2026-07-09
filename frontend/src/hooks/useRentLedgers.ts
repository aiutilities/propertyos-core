"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { RentLedger, RentLedgerListResponse } from "@/types/rent";

export function useRentLedgers() {
  const [ledgers, setLedgers] = useState<RentLedger[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response =
          await apiRequest<RentLedgerListResponse>("/rent-ledgers");
        setLedgers(response.data.items);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load rent ledgers.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return { ledgers, loading, error };
}
