"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { apiRequest } from "@/lib/api";
import {
  ApiError,
  isApiError,
} from "@/lib/api-error";
import type { Property } from "@/types/property";

type PropertyResponse = {
  success: boolean;
  data: Property;
};

export function useProperty(id: string) {
  const [property, setProperty] =
    useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] =
    useState<ApiError | null>(null);
  const [reloadVersion, setReloadVersion] =
    useState(0);

  const reload = useCallback(() => {
    setReloadVersion((current) => current + 1);
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const response =
          await apiRequest<PropertyResponse>(
            `/properties/${id}`,
          );

        if (!active) {
          return;
        }

        setProperty(response.data);
      } catch (caught) {
        if (!active) {
          return;
        }

        setProperty(null);

        if (isApiError(caught)) {
          setError(caught);
        } else {
          setError(
            new ApiError({
              status: 0,
              code: "UNKNOWN_ERROR",
              message:
                "Unable to load the property. Please try again.",
              technicalMessage:
                caught instanceof Error
                  ? caught.message
                  : String(caught),
              retryable: true,
              cause: caught,
            }),
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    if (id) {
      void load();
    } else {
      setProperty(null);
      setLoading(false);
      setError(null);
    }

    return () => {
      active = false;
    };
  }, [id, reloadVersion]);

  return {
    property,
    loading,
    error,
    errorMessage:
      error?.message ?? "",
    reload,
  };
}
