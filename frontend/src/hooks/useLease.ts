"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { Lease } from "@/types/lease";

type LeaseResponse = {
  success: boolean;
  data: Lease;
};

export function useLease(id: string) {
  const [lease, setLease] = useState<Lease | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await apiRequest<LeaseResponse>(`/agreements/${id}`);
        setLease(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load lease.");
      } finally {
        setLoading(false);
      }
    }

    if (id) load();
  }, [id]);

  return { lease, loading, error };
}
