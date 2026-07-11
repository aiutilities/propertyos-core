"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { Visit, VisitListResponse } from "@/types/visitor";

export interface VisitorListFilters {
  propertyId?: string;
  status?: string;
  hostPersonId?: string;
}

export function useVisitors(filters: VisitorListFilters = {}) {
  const [items, setItems] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (filters.propertyId) {
        params.set("propertyId", filters.propertyId);
      }

      if (filters.status) {
        params.set("status", filters.status);
      }

      if (filters.hostPersonId) {
        params.set("hostPersonId", filters.hostPersonId);
      }

      const suffix = params.toString() ? `?${params.toString()}` : "";

      const response = await apiRequest<VisitListResponse>(
        `/plugins/visitor${suffix}`,
      );

      setItems(response.data.items);
    } catch (err) {
      setItems([]);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load visitors.",
      );
    } finally {
      setLoading(false);
    }
  }, [filters.hostPersonId, filters.propertyId, filters.status]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    items,
    loading,
    error,
    refresh: load,
  };
}
