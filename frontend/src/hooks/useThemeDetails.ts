"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { Theme } from "@/types/theme";

type ThemeResponse = {
  success: boolean;
  data?: Theme;
};

export function useThemeDetails(id: string) {
  const [theme, setTheme] = useState<Theme | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [activating, setActivating] = useState(false);

  const load = useCallback(async () => {
    if (!id) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response =
        await apiRequest<ThemeResponse>(`/themes/${id}`);

      setTheme(response.data ?? null);

      if (!response.data) {
        setError("Theme not found.");
      }
    } catch (err) {
      setTheme(null);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load the theme.",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const activate = useCallback(async () => {
    if (!theme) {
      return false;
    }

    setActivating(true);
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
      setActivating(false);
    }
  }, [load, theme]);

  return {
    theme,
    loading,
    error,
    actionError,
    activating,
    reload: load,
    activate,
  };
}
