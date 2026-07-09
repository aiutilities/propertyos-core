"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { Lease, LeaseListResponse } from "@/types/lease";

export function useLeases() {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response =
          await apiRequest<LeaseListResponse>("/leases");
        setLeases(response.data.items);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load leases.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return { leases, loading, error };
}
