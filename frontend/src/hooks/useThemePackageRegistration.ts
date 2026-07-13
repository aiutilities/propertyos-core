"use client";

import { useState } from "react";
import { apiRequest } from "@/lib/api";
import type {
  ThemeManifest,
  ThemePackage,
} from "@/types/theme";

export type ThemePackageRegistrationInput = {
  name: string;
  version: string;
  sourcePath?: string;
  manifest: ThemeManifest;
  metadata?: Record<string, unknown>;
};

export function useThemePackageRegistration() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] =
    useState<ThemePackage | null>(null);

  async function register(
    input: ThemePackageRegistrationInput,
  ) {
    setSubmitting(true);
    setError("");
    setResult(null);

    try {
      const response = await apiRequest<ThemePackage>(
        "/theme-packages",
        {
          method: "POST",
          body: JSON.stringify(input),
        },
      );

      setResult(response);

      if (response.status === "INVALID") {
        setError(
          response.validationErrors.join(" ") ||
            "Theme package validation failed.",
        );
      }

      return response;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to register the theme package.",
      );
      return null;
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setError("");
    setResult(null);
  }

  return {
    submitting,
    error,
    result,
    register,
    reset,
  };
}
