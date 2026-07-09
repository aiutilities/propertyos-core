"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { Tenant } from "@/types/tenant";

type TenantResponse = {
  success: boolean;
  data: Tenant;
};

export function useTenant(id: string) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await apiRequest<TenantResponse>(`/tenants/${id}`);
        setTenant(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load tenant.");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      load();
    }
  }, [id]);

  return { tenant, loading, error };
}
