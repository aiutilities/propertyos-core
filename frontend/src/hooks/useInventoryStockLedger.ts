"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { apiRequest } from "@/lib/api";

import {
  ApiResponse,
  InventoryStockLedgerEntry,
  InventoryStockLedgerFilters,
} from "@/types/inventory";

function queryString(
  filters: InventoryStockLedgerFilters,
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

export function useInventoryStockLedger(
  filters: InventoryStockLedgerFilters = {},
) {
  const [entries, setEntries] =
    useState<InventoryStockLedgerEntry[]>([]);

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
          InventoryStockLedgerEntry[]
        >
      >(
        `/inventory/stock-ledger${queryString(
          filters,
        )}`,
      );

      setEntries(response.data ?? []);
    } catch (caught) {
      setEntries([]);
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load stock movement history.",
      );
    } finally {
      setLoading(false);
    }
  }, [
    filters.propertyId,
    filters.storeId,
    filters.binLocationId,
    filters.itemId,
    filters.batchId,
    filters.movementType,
    filters.sourceType,
    filters.sourceId,
    filters.referenceNumber,
    filters.dateFrom,
    filters.dateTo,
  ]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    entries,
    loading,
    error,
    refresh,
  };
}
