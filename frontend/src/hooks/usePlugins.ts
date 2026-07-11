"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { Plugin } from "@/types/plugin";

export function usePlugins() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPlugins = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest<Plugin[]>("/plugins/installed");
      setPlugins(response);
    } catch (err) {
      setPlugins([]);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load installed plugins.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPlugins();
  }, [loadPlugins]);

  return {
    plugins,
    loading,
    error,
    reload: loadPlugins,
  };
}
