"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { apiRequest } from "@/lib/api";

import {
  ApiResponse,
  CreateInventoryBrandInput,
  CreateInventoryCategoryInput,
  CreateInventoryUnitInput,
  InventoryBrand,
  InventoryItemCategory,
  InventoryUnitOfMeasure,
  UpdateInventoryBrandInput,
  UpdateInventoryCategoryInput,
  UpdateInventoryUnitInput,
} from "@/types/inventory";

export function useInventoryMasterData(
  activeOnly = false,
) {
  const [categories, setCategories] =
    useState<InventoryItemCategory[]>([]);
  const [brands, setBrands] =
    useState<InventoryBrand[]>([]);
  const [units, setUnits] =
    useState<InventoryUnitOfMeasure[]>([]);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    const query = `?activeOnly=${String(
      activeOnly,
    )}`;

    try {
      const [
        categoriesResponse,
        brandsResponse,
        unitsResponse,
      ] = await Promise.all([
        apiRequest<
          ApiResponse<
            InventoryItemCategory[]
          >
        >(`/inventory/categories${query}`),
        apiRequest<
          ApiResponse<InventoryBrand[]>
        >(`/inventory/brands${query}`),
        apiRequest<
          ApiResponse<
            InventoryUnitOfMeasure[]
          >
        >(`/inventory/units${query}`),
      ]);

      setCategories(
        categoriesResponse.data ?? [],
      );
      setBrands(brandsResponse.data ?? []);
      setUnits(unitsResponse.data ?? []);
    } catch (caught) {
      setCategories([]);
      setBrands([]);
      setUnits([]);
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load inventory master data.",
      );
    } finally {
      setLoading(false);
    }
  }, [activeOnly]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    categories,
    brands,
    units,
    loading,
    error,
    refresh,
  };
}

export async function createInventoryCategory(
  input: CreateInventoryCategoryInput,
): Promise<InventoryItemCategory> {
  const response = await apiRequest<
    ApiResponse<InventoryItemCategory>
  >("/inventory/categories", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return response.data;
}

export async function updateInventoryCategory(
  id: string,
  input: UpdateInventoryCategoryInput,
): Promise<InventoryItemCategory> {
  const response = await apiRequest<
    ApiResponse<InventoryItemCategory>
  >(`/inventory/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

  return response.data;
}

export async function createInventoryBrand(
  input: CreateInventoryBrandInput,
): Promise<InventoryBrand> {
  const response = await apiRequest<
    ApiResponse<InventoryBrand>
  >("/inventory/brands", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return response.data;
}

export async function updateInventoryBrand(
  id: string,
  input: UpdateInventoryBrandInput,
): Promise<InventoryBrand> {
  const response = await apiRequest<
    ApiResponse<InventoryBrand>
  >(`/inventory/brands/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

  return response.data;
}

export async function createInventoryUnit(
  input: CreateInventoryUnitInput,
): Promise<InventoryUnitOfMeasure> {
  const response = await apiRequest<
    ApiResponse<InventoryUnitOfMeasure>
  >("/inventory/units", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return response.data;
}

export async function updateInventoryUnit(
  id: string,
  input: UpdateInventoryUnitInput,
): Promise<InventoryUnitOfMeasure> {
  const response = await apiRequest<
    ApiResponse<InventoryUnitOfMeasure>
  >(`/inventory/units/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

  return response.data;
}
