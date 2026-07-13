"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type {
  MarketplaceListResponse,
  MarketplacePlugin,
  MarketplaceSearchResponse,
} from "@/types/plugin";

export type MarketplaceFilters = {
  query: string;
  category: string;
  tag: string;
};

const emptyFilters: MarketplaceFilters = {
  query: "",
  category: "",
  tag: "",
};

export function usePluginMarketplace() {
  const [plugins, setPlugins] = useState<MarketplacePlugin[]>([]);
  const [filters, setFilters] =
    useState<MarketplaceFilters>(emptyFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);

  const loadPlugins = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const hasFilters =
        filters.query.trim() ||
        filters.category.trim() ||
        filters.tag.trim();

      if (hasFilters) {
        const response =
          await apiRequest<MarketplaceSearchResponse>(
            "/plugin-marketplace/search",
            {
              method: "POST",
              body: JSON.stringify({
                query: filters.query.trim() || undefined,
                category: filters.category.trim() || undefined,
                tag: filters.tag.trim() || undefined,
              }),
            },
          );

        setPlugins(response.data.items);
        setTotal(response.data.total);
      } else {
        const response =
          await apiRequest<MarketplaceListResponse>(
            "/plugin-marketplace",
          );

        setPlugins(response.data);
        setTotal(response.data.length);
      }
    } catch (err) {
      setPlugins([]);
      setTotal(0);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load the plugin marketplace.",
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void loadPlugins();
  }, [loadPlugins]);

  function updateFilters(next: Partial<MarketplaceFilters>) {
    setFilters((current) => ({
      ...current,
      ...next,
    }));
  }

  function resetFilters() {
    setFilters(emptyFilters);
  }

  return {
    plugins,
    filters,
    total,
    loading,
    error,
    updateFilters,
    resetFilters,
    reload: loadPlugins,
  };
}
