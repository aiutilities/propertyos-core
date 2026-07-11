"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type {
  Plugin,
  PluginCapabilities,
  PluginDiagnostics,
  PluginLifecycle,
} from "@/types/plugin";

export function usePluginDetails(id: string) {
  const [plugin, setPlugin] = useState<Plugin | null>(null);
  const [lifecycle, setLifecycle] =
    useState<PluginLifecycle | null>(null);
  const [diagnostics, setDiagnostics] =
    useState<PluginDiagnostics | null>(null);
  const [capabilities, setCapabilities] =
    useState<PluginCapabilities | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!id) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [
        pluginResponse,
        lifecycleResponse,
        diagnosticsResponse,
        capabilitiesResponse,
      ] = await Promise.all([
        apiRequest<Plugin>(`/plugins/${id}`),
        apiRequest<PluginLifecycle>(`/plugins/${id}/lifecycle`),
        apiRequest<PluginDiagnostics>(`/plugins/${id}/diagnostics`),
        apiRequest<PluginCapabilities>(`/plugins/${id}/capabilities`),
      ]);

      setPlugin(pluginResponse);
      setLifecycle(lifecycleResponse);
      setDiagnostics(diagnosticsResponse);
      setCapabilities(capabilitiesResponse);
    } catch (err) {
      setPlugin(null);
      setLifecycle(null);
      setDiagnostics(null);
      setCapabilities(null);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load plugin details.",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    plugin,
    lifecycle,
    diagnostics,
    capabilities,
    loading,
    error,
    reload: load,
  };
}
