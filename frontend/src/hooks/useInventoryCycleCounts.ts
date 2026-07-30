"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { apiRequest } from "@/lib/api";

import {
  ApiResponse,
  CreateInventoryCycleCountInput,
  InventoryCycleCount,
  InventoryCycleCountFilters,
  InventoryCycleCountRecordInput,
} from "@/types/inventory";

function queryString(
  filters: InventoryCycleCountFilters,
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

export function useInventoryCycleCounts(
  filters: InventoryCycleCountFilters = {},
) {
  const [counts, setCounts] =
    useState<InventoryCycleCount[]>([]);

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
          InventoryCycleCount[]
        >
      >(
        `/inventory/cycle-counts${queryString(
          filters,
        )}`,
      );

      setCounts(response.data ?? []);
    } catch (caught) {
      setCounts([]);
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load cycle counts.",
      );
    } finally {
      setLoading(false);
    }
  }, [
    filters.propertyId,
    filters.storeId,
    filters.status,
    filters.dateFrom,
    filters.dateTo,
  ]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    counts,
    loading,
    error,
    refresh,
  };
}

export async function getInventoryCycleCount(
  id: string,
): Promise<InventoryCycleCount> {
  const response = await apiRequest<
    ApiResponse<InventoryCycleCount>
  >(`/inventory/cycle-counts/${id}`);

  return response.data;
}

export async function createInventoryCycleCount(
  input: CreateInventoryCycleCountInput,
): Promise<InventoryCycleCount> {
  const response = await apiRequest<
    ApiResponse<InventoryCycleCount>
  >("/inventory/cycle-counts", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return response.data;
}

export async function startInventoryCycleCount(
  id: string,
  startedByPersonId: string,
): Promise<InventoryCycleCount> {
  const response = await apiRequest<
    ApiResponse<InventoryCycleCount>
  >(`/inventory/cycle-counts/${id}/start`, {
    method: "POST",
    body: JSON.stringify({
      startedByPersonId,
    }),
  });

  return response.data;
}

export async function recordInventoryCycleCount(
  id: string,
  countedByPersonId: string,
  items: InventoryCycleCountRecordInput[],
): Promise<InventoryCycleCount> {
  const response = await apiRequest<
    ApiResponse<InventoryCycleCount>
  >(`/inventory/cycle-counts/${id}/record`, {
    method: "POST",
    body: JSON.stringify({
      countedByPersonId,
      items,
    }),
  });

  return response.data;
}

export async function completeInventoryCycleCount(
  id: string,
  completedByPersonId: string,
): Promise<InventoryCycleCount> {
  const response = await apiRequest<
    ApiResponse<InventoryCycleCount>
  >(`/inventory/cycle-counts/${id}/complete`, {
    method: "POST",
    body: JSON.stringify({
      completedByPersonId,
    }),
  });

  return response.data;
}

export async function postInventoryCycleCount(
  id: string,
  postedByPersonId: string,
): Promise<InventoryCycleCount> {
  const response = await apiRequest<
    ApiResponse<InventoryCycleCount>
  >(`/inventory/cycle-counts/${id}/post`, {
    method: "POST",
    body: JSON.stringify({
      postedByPersonId,
    }),
  });

  return response.data;
}

export async function cancelInventoryCycleCount(
  id: string,
  cancelledByPersonId: string,
  cancellationReason: string,
): Promise<InventoryCycleCount> {
  const response = await apiRequest<
    ApiResponse<InventoryCycleCount>
  >(`/inventory/cycle-counts/${id}/cancel`, {
    method: "POST",
    body: JSON.stringify({
      cancelledByPersonId,
      cancellationReason,
    }),
  });

  return response.data;
}
