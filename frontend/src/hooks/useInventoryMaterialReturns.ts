"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { apiRequest } from "@/lib/api";

import {
  ApiResponse,
  CreateInventoryMaterialReturnInput,
  InventoryMaterialReturn,
  InventoryMaterialReturnFilters,
} from "@/types/inventory";

function queryString(
  filters: InventoryMaterialReturnFilters,
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

export function useInventoryMaterialReturns(
  filters: InventoryMaterialReturnFilters = {},
) {
  const [returns, setReturns] =
    useState<InventoryMaterialReturn[]>([]);

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
          InventoryMaterialReturn[]
        >
      >(
        `/inventory/material-returns${queryString(
          filters,
        )}`,
      );

      setReturns(response.data ?? []);
    } catch (caught) {
      setReturns([]);
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load material returns.",
      );
    } finally {
      setLoading(false);
    }
  }, [
    filters.propertyId,
    filters.storeId,
    filters.materialIssueId,
    filters.status,
    filters.reasonCode,
    filters.dateFrom,
    filters.dateTo,
  ]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    returns,
    loading,
    error,
    refresh,
  };
}

export async function getInventoryMaterialReturn(
  id: string,
): Promise<InventoryMaterialReturn> {
  const response = await apiRequest<
    ApiResponse<InventoryMaterialReturn>
  >(`/inventory/material-returns/${id}`);

  return response.data;
}

export async function createInventoryMaterialReturn(
  input: CreateInventoryMaterialReturnInput,
): Promise<InventoryMaterialReturn> {
  const response = await apiRequest<
    ApiResponse<InventoryMaterialReturn>
  >("/inventory/material-returns", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return response.data;
}

export async function postInventoryMaterialReturn(
  id: string,
  postedByPersonId: string,
): Promise<InventoryMaterialReturn> {
  const response = await apiRequest<
    ApiResponse<InventoryMaterialReturn>
  >(`/inventory/material-returns/${id}/post`, {
    method: "POST",
    body: JSON.stringify({
      postedByPersonId,
    }),
  });

  return response.data;
}

export async function cancelInventoryMaterialReturn(
  id: string,
  cancelledByPersonId: string,
  cancellationReason: string,
): Promise<InventoryMaterialReturn> {
  const response = await apiRequest<
    ApiResponse<InventoryMaterialReturn>
  >(`/inventory/material-returns/${id}/cancel`, {
    method: "POST",
    body: JSON.stringify({
      cancelledByPersonId,
      cancellationReason,
    }),
  });

  return response.data;
}
