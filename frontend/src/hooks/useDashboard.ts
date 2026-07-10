"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { DashboardApiResponse, DashboardSummary } from "@/types/dashboard";

export function useDashboard() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setError("");

        const result =
          await apiRequest<DashboardApiResponse>("/admin/dashboard");

        setData(result.data);
      } catch (err) {
        setData(null);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load dashboard.",
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return { data, loading, error };
}
