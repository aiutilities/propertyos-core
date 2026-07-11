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
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  const upgrade = useCallback(
    async (version: string, notes?: string) => {
      setSubmitting(true);
      setActionError("");
      setActionSuccess("");

      try {
        await apiRequest(`/plugins/${id}/upgrade`, {
          method: "POST",
          body: JSON.stringify({
            version,
            notes: notes || undefined,
          }),
        });

        setActionSuccess(`Plugin upgraded to version ${version}.`);
        await load();
        return true;
      } catch (err) {
        setActionError(
          err instanceof Error
            ? err.message
            : "Unable to upgrade the plugin.",
        );
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [id, load],
  );

  const rollback = useCallback(
    async (targetVersion: string, notes?: string) => {
      setSubmitting(true);
      setActionError("");
      setActionSuccess("");

      try {
        await apiRequest(`/plugins/${id}/rollback`, {
          method: "POST",
          body: JSON.stringify({
            targetVersion,
            notes: notes || undefined,
          }),
        });

        setActionSuccess(
          `Plugin rolled back to version ${targetVersion}.`,
        );
        await load();
        return true;
      } catch (err) {
        setActionError(
          err instanceof Error
            ? err.message
            : "Unable to roll back the plugin.",
        );
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [id, load],
  );

  function clearActionMessages() {
    setActionError("");
    setActionSuccess("");
  }

  return {
    plugin,
    lifecycle,
    diagnostics,
    capabilities,
    loading,
    error,
    actionError,
    actionSuccess,
    submitting,
    reload: load,
    upgrade,
    rollback,
    clearActionMessages,
  };
}
