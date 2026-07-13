"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { ThemePackage } from "@/types/theme";

export function useThemePackages() {
  const [packages, setPackages] = useState<ThemePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyPackageId, setBusyPackageId] =
    useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response =
        await apiRequest<ThemePackage[]>("/theme-packages");

      setPackages(response);
    } catch (err) {
      setPackages([]);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load theme packages.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const install = useCallback(
    async (themePackage: ThemePackage) => {
      setBusyPackageId(themePackage.id);
      setActionError("");

      try {
        const result = await apiRequest<ThemePackage | undefined>(
          `/theme-packages/${themePackage.id}/install`,
          {
            method: "PATCH",
          },
        );

        if (!result) {
          throw new Error("Theme package was not found.");
        }

        if (result.status === "INVALID") {
          throw new Error(
            result.validationErrors.join(" ") ||
              "Theme package validation failed.",
          );
        }

        await load();
        return true;
      } catch (err) {
        setActionError(
          err instanceof Error
            ? err.message
            : "Unable to install the theme package.",
        );
        return false;
      } finally {
        setBusyPackageId(null);
      }
    },
    [load],
  );

  const archive = useCallback(
    async (themePackage: ThemePackage) => {
      setBusyPackageId(themePackage.id);
      setActionError("");

      try {
        const result = await apiRequest<ThemePackage | undefined>(
          `/theme-packages/${themePackage.id}/archive`,
          {
            method: "PATCH",
          },
        );

        if (!result) {
          throw new Error("Theme package was not found.");
        }

        await load();
        return true;
      } catch (err) {
        setActionError(
          err instanceof Error
            ? err.message
            : "Unable to archive the theme package.",
        );
        return false;
      } finally {
        setBusyPackageId(null);
      }
    },
    [load],
  );

  return {
    packages,
    loading,
    error,
    actionError,
    busyPackageId,
    reload: load,
    install,
    archive,
  };
}
