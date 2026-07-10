"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { TenantSpace, TenantSpacesResponse } from "@/types/tenant-space";

export function useTenantSpaces(tenantId: string) {
  const [spaces, setSpaces] = useState<TenantSpace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await apiRequest<TenantSpacesResponse>(
          `/tenants/${tenantId}/spaces`,
        );
        setSpaces(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load tenant spaces.");
      } finally {
        setLoading(false);
      }
    }

    if (tenantId) {
      load();
    }
  }, [tenantId]);

  return { spaces, loading, error };
}
