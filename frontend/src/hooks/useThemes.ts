"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { Theme } from "@/types/theme";

export function useThemes() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      const response = await apiRequest<{success:boolean,data:Theme[]}>("/themes");
      setThemes(response.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load themes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return {
    themes,
    loading,
    error,
    reload: load,
  };
}
