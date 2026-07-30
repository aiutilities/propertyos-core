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
  MapsGeocodeInput,
  MapsHealth,
  MapsResult,
  MapsReverseGeocodeInput,
  MapsRouteInput,
} from "@/types/maps";

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

function queryString(
  input: MapsGeocodeInput,
): string {
  const params = new URLSearchParams();

  Object.entries(input).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== ""
      ) {
        params.set(
          key,
          String(value),
        );
      }
    },
  );

  return params.toString();
}

export async function geocodeAddress(
  input: MapsGeocodeInput,
): Promise<MapsResult> {
  const response = await apiRequest<
    ApiResponse<MapsResult>
  >(
    `/maps/geocode?${queryString(
      input,
    )}`,
  );

  return response.data;
}

export async function reverseGeocodeCoordinate(
  input: MapsReverseGeocodeInput,
): Promise<MapsResult> {
  const response = await apiRequest<
    ApiResponse<MapsResult>
  >("/maps/reverse-geocode", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return response.data;
}

export async function calculateMapRoute(
  input: MapsRouteInput,
): Promise<MapsResult> {
  const response = await apiRequest<
    ApiResponse<MapsResult>
  >("/maps/route", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return response.data;
}

export async function getMapsHealth():
  Promise<MapsHealth> {
  const response = await apiRequest<
    ApiResponse<MapsHealth>
  >("/maps/health");

  return response.data;
}

export function useMapsHealth() {
  const [health, setHealth] =
    useState<MapsHealth | null>(
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
        await getMapsHealth(),
      );
    } catch (caught) {
      setHealth(null);
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load Maps runtime health.",
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
