"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  apiRequest,
} from "@/lib/api";

import {
  PLACES_ROUTES,
  PlacesHealth,
  PlacesPayload,
  PlacesResult,
} from "@/types/places";

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

type PlacesRoute = {
  method: string;
  path: string;
};

function queryString(
  payload: PlacesPayload,
): string {
  const params = new URLSearchParams();

  Object.entries(payload).forEach(
    ([key, value]) => {
      if (
        value === undefined ||
        value === null ||
        value === ""
      ) {
        return;
      }

      params.set(
        key,
        typeof value === "object"
          ? JSON.stringify(value)
          : String(value),
      );
    },
  );

  const query = params.toString();

  return query ? `?${query}` : "";
}

async function invokePlaces(
  route: PlacesRoute,
  payload: PlacesPayload = {},
): Promise<PlacesResult> {
  const method = route.method.toUpperCase();

  const url =
    method === "GET"
      ? `${route.path}${queryString(payload)}`
      : route.path;

  const response = await apiRequest<
    ApiResponse<PlacesResult>
  >(url, {
    method,
    body:
      method === "GET"
        ? undefined
        : JSON.stringify(payload),
  });

  return response.data;
}

export function searchPlaces(
  payload: PlacesPayload,
): Promise<PlacesResult> {
  return invokePlaces(
    PLACES_ROUTES.search,
    payload,
  );
}

export function findNearbyPlaces(
  payload: PlacesPayload,
): Promise<PlacesResult> {
  return invokePlaces(
    PLACES_ROUTES.nearby,
    payload,
  );
}

export function getPlaceDetails(
  payload: PlacesPayload,
): Promise<PlacesResult> {
  return invokePlaces(
    PLACES_ROUTES.details,
    payload,
  );
}

export async function getPlacesHealth():
  Promise<PlacesHealth> {
  const result = await invokePlaces(
    PLACES_ROUTES.health,
  );

  if (
    typeof result === "object" &&
    result !== null &&
    !Array.isArray(result)
  ) {
    return result;
  }

  return {
    status: String(result),
  };
}

export function usePlacesHealth() {
  const [health, setHealth] =
    useState<PlacesHealth | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setHealth(
        await getPlacesHealth(),
      );
    } catch (caught) {
      setHealth(null);
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load Places runtime health.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    health,
    loading,
    error,
    refresh,
  };
}
