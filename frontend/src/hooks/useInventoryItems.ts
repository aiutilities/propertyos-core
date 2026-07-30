"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { apiRequest } from "@/lib/api";

import {
  ApiResponse,
  CreateInventoryItemInput,
  InventoryBrand,
  InventoryItem,
  InventoryItemCategory,
  InventoryItemFilters,
  InventoryUnitOfMeasure,
  TransitionInventoryItemInput,
  UpdateInventoryItemInput,
} from "@/types/inventory";

function queryString(
  filters: InventoryItemFilters,
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

export function useInventoryItems(
  filters: InventoryItemFilters = {},
) {
  const [items, setItems] = useState<
    InventoryItem[]
  >([]);
  const [
    categories,
    setCategories,
  ] = useState<InventoryItemCategory[]>([]);
  const [brands, setBrands] = useState<
    InventoryBrand[]
  >([]);
  const [units, setUnits] = useState<
    InventoryUnitOfMeasure[]
  >([]);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [
        itemsResponse,
        categoriesResponse,
        brandsResponse,
        unitsResponse,
      ] = await Promise.all([
        apiRequest<
          ApiResponse<InventoryItem[]>
        >(
          `/inventory/items${queryString(
            filters,
          )}`,
        ),
        apiRequest<
          ApiResponse<
            InventoryItemCategory[]
          >
        >("/inventory/categories"),
        apiRequest<
          ApiResponse<InventoryBrand[]>
        >("/inventory/brands"),
        apiRequest<
          ApiResponse<
            InventoryUnitOfMeasure[]
          >
        >("/inventory/units"),
      ]);

      setItems(itemsResponse.data ?? []);
      setCategories(
        categoriesResponse.data ?? [],
      );
      setBrands(brandsResponse.data ?? []);
      setUnits(unitsResponse.data ?? []);
    } catch (caught) {
      setItems([]);
      setCategories([]);
      setBrands([]);
      setUnits([]);
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load inventory items.",
      );
    } finally {
      setLoading(false);
    }
  }, [
    filters.categoryId,
    filters.unitOfMeasureId,
    filters.brandId,
    filters.itemType,
    filters.isActive,
    filters.search,
  ]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    items,
    categories,
    brands,
    units,
    loading,
    error,
    refresh,
  };
}

export async function getInventoryItem(
  id: string,
): Promise<InventoryItem> {
  const response = await apiRequest<
    ApiResponse<InventoryItem>
  >(`/inventory/items/${id}`);

  return response.data;
}

export async function createInventoryItem(
  input: CreateInventoryItemInput,
): Promise<InventoryItem> {
  const response = await apiRequest<
    ApiResponse<InventoryItem>
  >("/inventory/items", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return response.data;
}

export async function updateInventoryItem(
  id: string,
  input: UpdateInventoryItemInput,
): Promise<InventoryItem> {
  const response = await apiRequest<
    ApiResponse<InventoryItem>
  >(`/inventory/items/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

  return response.data;
}

export async function transitionInventoryItem(
  id: string,
  active: boolean,
  input: TransitionInventoryItemInput,
): Promise<InventoryItem> {
  const operation = active
    ? "activate"
    : "deactivate";

  const response = await apiRequest<
    ApiResponse<InventoryItem>
  >(
    `/inventory/items/${id}/${operation}`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );

  return response.data;
}
