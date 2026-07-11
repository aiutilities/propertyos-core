"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { Theme } from "@/types/theme";

type ThemeListResponse = {
  success: boolean;
  data: Theme[];
};

export function useThemes() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [activatingThemeId, setActivatingThemeId] =
    useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response =
        await apiRequest<ThemeListResponse>("/themes");

      setThemes(response.data ?? []);
    } catch (err) {
      setThemes([]);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load themes.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const activate = useCallback(
    async (theme: Theme) => {
      setActivatingThemeId(theme.id);
      setActionError("");

      try {
        await apiRequest<Theme | undefined>(
          `/themes/${theme.id}/activate`,
          {
            method: "POST",
          },
        );

        await load();
        return true;
      } catch (err) {
        setActionError(
          err instanceof Error
            ? err.message
            : "Unable to activate the theme.",
        );
        return false;
      } finally {
        setActivatingThemeId(null);
      }
    },
    [load],
  );

  return {
    themes,
    loading,
    error,
    actionError,
    activatingThemeId,
    reload: load,
    activate,
  };
}
