"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { apiRequest } from "@/lib/api";

import {
  ApiResponse,
  CreateInventoryTransferInput,
  InventoryStockTransfer,
  InventoryTransferFilters,
  InventoryTransferQuantityInput,
} from "@/types/inventory";

function queryString(
  filters: InventoryTransferFilters,
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

export function useInventoryTransfers(
  filters: InventoryTransferFilters = {},
) {
  const [transfers, setTransfers] =
    useState<InventoryStockTransfer[]>([]);
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
          InventoryStockTransfer[]
        >
      >(
        `/inventory/transfers${queryString(
          filters,
        )}`,
      );

      setTransfers(response.data ?? []);
    } catch (caught) {
      setTransfers([]);
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load inventory transfers.",
      );
    } finally {
      setLoading(false);
    }
  }, [
    filters.propertyId,
    filters.sourceStoreId,
    filters.destinationStoreId,
    filters.status,
  ]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    transfers,
    loading,
    error,
    refresh,
  };
}

export async function getInventoryTransfer(
  id: string,
): Promise<InventoryStockTransfer> {
  const response = await apiRequest<
    ApiResponse<InventoryStockTransfer>
  >(`/inventory/transfers/${id}`);

  return response.data;
}

export async function createInventoryTransfer(
  input: CreateInventoryTransferInput,
): Promise<InventoryStockTransfer> {
  const response = await apiRequest<
    ApiResponse<InventoryStockTransfer>
  >("/inventory/transfers", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return response.data;
}

export async function dispatchInventoryTransfer(
  id: string,
  dispatchedByPersonId: string,
  items: InventoryTransferQuantityInput[],
): Promise<InventoryStockTransfer> {
  const response = await apiRequest<
    ApiResponse<InventoryStockTransfer>
  >(`/inventory/transfers/${id}/dispatch`, {
    method: "POST",
    body: JSON.stringify({
      dispatchedByPersonId,
      items,
    }),
  });

  return response.data;
}

export async function receiveInventoryTransfer(
  id: string,
  receivedByPersonId: string,
  items: InventoryTransferQuantityInput[],
): Promise<InventoryStockTransfer> {
  const response = await apiRequest<
    ApiResponse<InventoryStockTransfer>
  >(`/inventory/transfers/${id}/receive`, {
    method: "POST",
    body: JSON.stringify({
      receivedByPersonId,
      items,
    }),
  });

  return response.data;
}

export async function cancelInventoryTransfer(
  id: string,
  cancelledByPersonId: string,
  cancellationReason: string,
): Promise<InventoryStockTransfer> {
  const response = await apiRequest<
    ApiResponse<InventoryStockTransfer>
  >(`/inventory/transfers/${id}/cancel`, {
    method: "POST",
    body: JSON.stringify({
      cancelledByPersonId,
      cancellationReason,
    }),
  });

  return response.data;
}
