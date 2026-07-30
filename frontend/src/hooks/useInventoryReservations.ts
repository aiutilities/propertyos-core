"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { apiRequest } from "@/lib/api";

import {
  ApiResponse,
  CreateInventoryReservationInput,
  InventoryReservationActionInput,
  InventoryReservationFilters,
  InventoryStockReservation,
} from "@/types/inventory";

function queryString(
  filters: InventoryReservationFilters,
): string {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== ""
      ) {
        params.set(key, String(value));
      }
    },
  );

  const query = params.toString();

  return query ? `?${query}` : "";
}

export function useInventoryReservations(
  filters: InventoryReservationFilters = {},
) {
  const [
    reservations,
    setReservations,
  ] = useState<
    InventoryStockReservation[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest<
        ApiResponse<
          InventoryStockReservation[]
        >
      >(
        `/inventory/reservations${queryString(
          filters,
        )}`,
      );

      setReservations(
        response.data ?? [],
      );
    } catch (caught) {
      setReservations([]);
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load inventory reservations.",
      );
    } finally {
      setLoading(false);
    }
  }, [
    filters.propertyId,
    filters.storeId,
    filters.itemId,
    filters.status,
  ]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    reservations,
    loading,
    error,
    refresh,
  };
}

export async function getInventoryReservation(
  id: string,
): Promise<InventoryStockReservation> {
  const response = await apiRequest<
    ApiResponse<InventoryStockReservation>
  >(`/inventory/reservations/${id}`);

  return response.data;
}

export async function createInventoryReservation(
  input: CreateInventoryReservationInput,
): Promise<InventoryStockReservation> {
  const response = await apiRequest<
    ApiResponse<InventoryStockReservation>
  >("/inventory/reservations", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return response.data;
}

async function reservationAction(
  id: string,
  operation:
    | "release"
    | "fulfill"
    | "expire",
  input: InventoryReservationActionInput,
): Promise<InventoryStockReservation> {
  const personField =
    operation === "release"
      ? "releasedByPersonId"
      : operation === "fulfill"
        ? "fulfilledByPersonId"
        : "expiredByPersonId";

  const body: Record<string, unknown> = {
    [personField]: input.personId,
    remarks: input.remarks,
  };

  if (
    operation !== "expire" &&
    input.quantity !== undefined
  ) {
    body.quantity = input.quantity;
  }

  const response = await apiRequest<
    ApiResponse<InventoryStockReservation>
  >(
    `/inventory/reservations/${id}/${operation}`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );

  return response.data;
}

export function releaseInventoryReservation(
  id: string,
  input: InventoryReservationActionInput,
) {
  return reservationAction(
    id,
    "release",
    input,
  );
}

export function fulfillInventoryReservation(
  id: string,
  input: InventoryReservationActionInput,
) {
  return reservationAction(
    id,
    "fulfill",
    input,
  );
}

export function expireInventoryReservation(
  id: string,
  input: InventoryReservationActionInput,
) {
  return reservationAction(
    id,
    "expire",
    input,
  );
}
