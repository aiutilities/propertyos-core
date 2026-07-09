"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { DashboardApiResponse, DashboardSummary } from "@/types/dashboard";

export function useDashboard() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const result = await apiRequest<DashboardApiResponse>("/admin/dashboard");
        setData(result.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return { data, loading };
}
