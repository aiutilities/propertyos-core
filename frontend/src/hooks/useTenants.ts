"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { Tenant, TenantListResponse } from "@/types/tenant";

export function useTenants() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await apiRequest<TenantListResponse>("/tenants");
        setTenants(response.data.items);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load tenants.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return { tenants, loading, error };
}
