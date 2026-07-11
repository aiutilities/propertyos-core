"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { Plugin } from "@/types/plugin";

export type PluginLifecycleAction =
  | "ACTIVATE"
  | "DEACTIVATE"
  | "UNINSTALL";

export function usePlugins() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [transitioningPluginId, setTransitioningPluginId] =
    useState<string | null>(null);

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

  const transitionPlugin = useCallback(
    async (pluginId: string, action: PluginLifecycleAction) => {
      setTransitioningPluginId(pluginId);
      setActionError("");

      try {
        const result = await apiRequest<{
          success?: boolean;
          status?: string;
          error?: string;
          dependents?: Array<{
            id: string;
            name: string;
            version: string;
          }>;
        }>(`/plugins/${pluginId}/lifecycle`, {
          method: "POST",
          body: JSON.stringify({ action }),
        });

        if (result.success === false) {
          const dependents =
            result.dependents?.map((item) => item.name).join(", ") ?? "";

          throw new Error(
            dependents
              ? `Plugin action blocked by dependent plugins: ${dependents}.`
              : result.error ?? "Plugin action could not be completed.",
          );
        }

        await loadPlugins();
        return true;
      } catch (err) {
        setActionError(
          err instanceof Error
            ? err.message
            : "Unable to update the plugin.",
        );
        return false;
      } finally {
        setTransitioningPluginId(null);
      }
    },
    [loadPlugins],
  );

  return {
    plugins,
    loading,
    error,
    actionError,
    transitioningPluginId,
    reload: loadPlugins,
    transitionPlugin,
  };
}
