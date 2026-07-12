"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import {
  ApiResponse,
  CreateVehicleInput,
  Vehicle,
  VehicleFilters,
  VehicleMetrics,
  VehicleMovement,
  VehicleMovementType,
  VehicleStatus,
} from "@/types/vehicle";

function queryString(filters: VehicleFilters): string {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  return query ? `?${query}` : "";
}

export function useVehicles(
  filters: VehicleFilters = {},
) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [metrics, setMetrics] = useState<VehicleMetrics | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [vehiclesResponse, metricsResponse] =
        await Promise.all([
          apiRequest<ApiResponse<Vehicle[]>>(
            `/vehicles${queryString(filters)}`,
          ),
          apiRequest<ApiResponse<VehicleMetrics>>(
            `/vehicles/metrics${
              filters.propertyId
                ? `?propertyId=${encodeURIComponent(
                    filters.propertyId,
                  )}`
                : ""
            }`,
          ),
        ]);

      setVehicles(vehiclesResponse.data ?? []);
      setMetrics(metricsResponse.data ?? null);
    } catch (err) {
      setVehicles([]);
      setMetrics(null);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load vehicles.",
      );
    } finally {
      setLoading(false);
    }
  }, [
    filters.propertyId,
    filters.spaceId,
    filters.ownerPersonId,
    filters.vehicleType,
    filters.status,
    filters.registrationNumber,
    filters.search,
  ]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    vehicles,
    metrics,
    loading,
    error,
    refresh,
  };
}

export async function getVehicle(
  id: string,
): Promise<Vehicle> {
  const response = await apiRequest<ApiResponse<Vehicle>>(
    `/vehicles/${id}`,
  );

  return response.data;
}

export async function lookupVehicle(
  registrationNumber: string,
): Promise<Vehicle> {
  const response = await apiRequest<ApiResponse<Vehicle>>(
    `/vehicles/lookup/${encodeURIComponent(
      registrationNumber,
    )}`,
  );

  return response.data;
}

export async function createVehicle(
  input: CreateVehicleInput,
): Promise<Vehicle> {
  const response = await apiRequest<ApiResponse<Vehicle>>(
    "/vehicles",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );

  return response.data;
}

export async function updateVehicleStatus(
  id: string,
  status: VehicleStatus,
  changedByPersonId: string,
  reason?: string,
): Promise<Vehicle> {
  const response = await apiRequest<ApiResponse<Vehicle>>(
    `/vehicles/${id}/status`,
    {
      method: "POST",
      body: JSON.stringify({
        status,
        changedByPersonId,
        reason,
      }),
    },
  );

  return response.data;
}

export async function recordVehicleMovement(
  id: string,
  movementType: VehicleMovementType,
  recordedByPersonId: string,
  gate?: string,
  remarks?: string,
): Promise<VehicleMovement> {
  const response = await apiRequest<
    ApiResponse<VehicleMovement>
  >(`/vehicles/${id}/movements`, {
    method: "POST",
    body: JSON.stringify({
      movementType,
      recordedByPersonId,
      gate,
      remarks,
    }),
  });

  return response.data;
}
