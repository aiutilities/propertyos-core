"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { apiRequest } from "@/lib/api";

import {
  ApiResponse,
  InventoryBrand,
  InventoryDashboardFilters,
  InventoryDashboardMetrics,
  InventoryItem,
  InventoryItemCategory,
  InventoryStockBalance,
  InventoryStore,
  InventoryUnitOfMeasure,
} from "@/types/inventory";

function itemQueryString(
  filters: InventoryDashboardFilters,
): string {
  const params = new URLSearchParams();

  if (filters.search) {
    params.set("search", filters.search);
  }

  if (filters.itemType) {
    params.set("itemType", filters.itemType);
  }

  if (filters.activeOnly !== undefined) {
    params.set(
      "isActive",
      String(filters.activeOnly),
    );
  }

  const query = params.toString();

  return query ? `?${query}` : "";
}

function stockQueryString(
  filters: InventoryDashboardFilters,
): string {
  const params = new URLSearchParams();

  if (filters.belowReorderLevel !== undefined) {
    params.set(
      "belowReorderLevel",
      String(filters.belowReorderLevel),
    );
  }

  const query = params.toString();

  return query ? `?${query}` : "";
}

function calculateMetrics(
  items: InventoryItem[],
  stores: InventoryStore[],
  stockBalances: InventoryStockBalance[],
): InventoryDashboardMetrics {
  return {
    totalItems: items.length,
    activeItems: items.filter(
      (item) => item.isActive,
    ).length,
    stores: stores.length,
    stockLines: stockBalances.length,
    totalOnHand: stockBalances.reduce(
      (total, row) =>
        total + Number(row.quantityOnHand),
      0,
    ),
    totalReserved: stockBalances.reduce(
      (total, row) =>
        total + Number(row.reservedQuantity),
      0,
    ),
    totalAvailable: stockBalances.reduce(
      (total, row) =>
        total + Number(row.availableQuantity),
      0,
    ),
    belowReorderLines: stockBalances.filter(
      (row) =>
        Number(row.availableQuantity) <= 0,
    ).length,
  };
}

export function useInventoryDashboard(
  filters: InventoryDashboardFilters = {},
) {
  const [items, setItems] = useState<
    InventoryItem[]
  >([]);
  const [stores, setStores] = useState<
    InventoryStore[]
  >([]);
  const [
    stockBalances,
    setStockBalances,
  ] = useState<InventoryStockBalance[]>([]);
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
  const [metrics, setMetrics] =
    useState<InventoryDashboardMetrics>({
      totalItems: 0,
      activeItems: 0,
      stores: 0,
      stockLines: 0,
      totalOnHand: 0,
      totalReserved: 0,
      totalAvailable: 0,
      belowReorderLines: 0,
    });
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
        storesResponse,
        stockResponse,
        categoriesResponse,
        brandsResponse,
        unitsResponse,
      ] = await Promise.all([
        apiRequest<ApiResponse<InventoryItem[]>>(
          `/inventory/items${itemQueryString(
            filters,
          )}`,
        ),
        apiRequest<ApiResponse<InventoryStore[]>>(
          "/inventory/stores",
        ),
        apiRequest<
          ApiResponse<InventoryStockBalance[]>
        >(
          `/inventory/stock-balances${stockQueryString(
            filters,
          )}`,
        ),
        apiRequest<
          ApiResponse<InventoryItemCategory[]>
        >("/inventory/categories"),
        apiRequest<ApiResponse<InventoryBrand[]>>(
          "/inventory/brands",
        ),
        apiRequest<
          ApiResponse<InventoryUnitOfMeasure[]>
        >("/inventory/units"),
      ]);

      const nextItems =
        itemsResponse.data ?? [];
      const nextStores =
        storesResponse.data ?? [];
      const nextStock =
        stockResponse.data ?? [];

      setItems(nextItems);
      setStores(nextStores);
      setStockBalances(nextStock);
      setCategories(
        categoriesResponse.data ?? [],
      );
      setBrands(brandsResponse.data ?? []);
      setUnits(unitsResponse.data ?? []);
      setMetrics(
        calculateMetrics(
          nextItems,
          nextStores,
          nextStock,
        ),
      );
    } catch (caught) {
      setItems([]);
      setStores([]);
      setStockBalances([]);
      setCategories([]);
      setBrands([]);
      setUnits([]);
      setMetrics(
        calculateMetrics([], [], []),
      );
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load inventory.",
      );
    } finally {
      setLoading(false);
    }
  }, [
    filters.search,
    filters.itemType,
    filters.activeOnly,
    filters.belowReorderLevel,
  ]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    items,
    stores,
    stockBalances,
    categories,
    brands,
    units,
    metrics,
    loading,
    error,
    refresh,
  };
}
