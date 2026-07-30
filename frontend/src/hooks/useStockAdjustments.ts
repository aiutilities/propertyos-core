"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { apiRequest } from "@/lib/api";

import {
  ApiResponse,
  CreateInventoryAdjustmentInput,
  InventoryAdjustmentFilters,
  InventoryAdjustmentTransitionInput,
  InventoryStockAdjustment,
} from "@/types/inventory";

function queryString(
  filters: InventoryAdjustmentFilters,
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

export function useStockAdjustments(
  filters: InventoryAdjustmentFilters = {},
) {
  const [adjustments, setAdjustments] =
    useState<InventoryStockAdjustment[]>([]);
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
          InventoryStockAdjustment[]
        >
      >(
        `/inventory/adjustments${queryString(
          filters,
        )}`,
      );

      setAdjustments(
        response.data ?? [],
      );
    } catch (caught) {
      setAdjustments([]);
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load stock adjustments.",
      );
    } finally {
      setLoading(false);
    }
  }, [
    filters.propertyId,
    filters.storeId,
    filters.status,
  ]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    adjustments,
    loading,
    error,
    refresh,
  };
}


export async function createStockAdjustment(
  input: CreateInventoryAdjustmentInput,
): Promise<InventoryStockAdjustment> {
  const response = await apiRequest<
    ApiResponse<InventoryStockAdjustment>
  >("/inventory/adjustments", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return response.data;
}

export async function getStockAdjustment(
  id: string,
): Promise<InventoryStockAdjustment> {
  const response = await apiRequest<
    ApiResponse<InventoryStockAdjustment>
  >(`/inventory/adjustments/${id}`);

  return response.data;
}

async function transitionStockAdjustment(
  id: string,
  operation: "post" | "cancel",
  input: InventoryAdjustmentTransitionInput,
): Promise<InventoryStockAdjustment> {
  const response = await apiRequest<
    ApiResponse<InventoryStockAdjustment>
  >(
    `/inventory/adjustments/${id}/${operation}`,
    {
      method: "POST",
      body: JSON.stringify(
        operation === "post"
          ? {
              postedByPersonId:
                input.personId,
              remarks: input.remarks,
            }
          : {
              cancelledByPersonId:
                input.personId,
              remarks: input.remarks,
            },
      ),
    },
  );

  return response.data;
}

export function postStockAdjustment(
  id: string,
  input: InventoryAdjustmentTransitionInput,
): Promise<InventoryStockAdjustment> {
  return transitionStockAdjustment(
    id,
    "post",
    input,
  );
}

export function cancelStockAdjustment(
  id: string,
  input: InventoryAdjustmentTransitionInput,
): Promise<InventoryStockAdjustment> {
  return transitionStockAdjustment(
    id,
    "cancel",
    input,
  );
}
