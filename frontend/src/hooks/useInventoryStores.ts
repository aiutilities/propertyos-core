"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { apiRequest } from "@/lib/api";

import {
  ApiResponse,
  CreateInventoryBinInput,
  CreateInventoryStoreInput,
  InventoryBinLocation,
  InventoryStore,
  InventoryStoreFilters,
  TransitionInventoryStoreInput,
  UpdateInventoryBinInput,
  UpdateInventoryStoreInput,
} from "@/types/inventory";

function storeQueryString(
  filters: InventoryStoreFilters,
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

export function useInventoryStores(
  filters: InventoryStoreFilters = {},
) {
  const [stores, setStores] =
    useState<InventoryStore[]>([]);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest<
        ApiResponse<InventoryStore[]>
      >(
        `/inventory/stores${storeQueryString(
          filters,
        )}`,
      );

      setStores(response.data ?? []);
    } catch (caught) {
      setStores([]);
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load inventory stores.",
      );
    } finally {
      setLoading(false);
    }
  }, [
    filters.propertyId,
    filters.zoneId,
    filters.spaceId,
    filters.isActive,
    filters.search,
  ]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    stores,
    loading,
    error,
    refresh,
  };
}

export function useInventoryBins(
  storeId?: string,
) {
  const [bins, setBins] =
    useState<InventoryBinLocation[]>([]);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const query = storeId
        ? `?storeId=${encodeURIComponent(
            storeId,
          )}`
        : "";

      const response = await apiRequest<
        ApiResponse<InventoryBinLocation[]>
      >(`/inventory/bins${query}`);

      setBins(response.data ?? []);
    } catch (caught) {
      setBins([]);
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load inventory bins.",
      );
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    bins,
    loading,
    error,
    refresh,
  };
}

export async function createInventoryStore(
  input: CreateInventoryStoreInput,
): Promise<InventoryStore> {
  const response = await apiRequest<
    ApiResponse<InventoryStore>
  >("/inventory/stores", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return response.data;
}

export async function updateInventoryStore(
  id: string,
  input: UpdateInventoryStoreInput,
): Promise<InventoryStore> {
  const response = await apiRequest<
    ApiResponse<InventoryStore>
  >(`/inventory/stores/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

  return response.data;
}

export async function transitionInventoryStore(
  id: string,
  active: boolean,
  input: TransitionInventoryStoreInput,
): Promise<InventoryStore> {
  const operation = active
    ? "activate"
    : "deactivate";

  const response = await apiRequest<
    ApiResponse<InventoryStore>
  >(
    `/inventory/stores/${id}/${operation}`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );

  return response.data;
}

export async function createInventoryBin(
  input: CreateInventoryBinInput,
): Promise<InventoryBinLocation> {
  const response = await apiRequest<
    ApiResponse<InventoryBinLocation>
  >("/inventory/bins", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return response.data;
}

export async function updateInventoryBin(
  id: string,
  input: UpdateInventoryBinInput,
): Promise<InventoryBinLocation> {
  const response = await apiRequest<
    ApiResponse<InventoryBinLocation>
  >(`/inventory/bins/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

  return response.data;
}
