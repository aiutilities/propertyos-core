"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { apiRequest } from "@/lib/api";

import {
  ApiResponse,
  CreateInventoryMaterialIssueInput,
  InventoryMaterialIssue,
  InventoryMaterialIssueFilters,
} from "@/types/inventory";

function queryString(
  filters: InventoryMaterialIssueFilters,
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

export function useInventoryMaterialIssues(
  filters: InventoryMaterialIssueFilters = {},
) {
  const [issues, setIssues] =
    useState<InventoryMaterialIssue[]>([]);

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
          InventoryMaterialIssue[]
        >
      >(
        `/inventory/material-issues${queryString(
          filters,
        )}`,
      );

      setIssues(response.data ?? []);
    } catch (caught) {
      setIssues([]);
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load material issues.",
      );
    } finally {
      setLoading(false);
    }
  }, [
    filters.propertyId,
    filters.storeId,
    filters.status,
    filters.reasonCode,
    filters.dateFrom,
    filters.dateTo,
  ]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    issues,
    loading,
    error,
    refresh,
  };
}

export async function getInventoryMaterialIssue(
  id: string,
): Promise<InventoryMaterialIssue> {
  const response = await apiRequest<
    ApiResponse<InventoryMaterialIssue>
  >(`/inventory/material-issues/${id}`);

  return response.data;
}

export async function createInventoryMaterialIssue(
  input: CreateInventoryMaterialIssueInput,
): Promise<InventoryMaterialIssue> {
  const response = await apiRequest<
    ApiResponse<InventoryMaterialIssue>
  >("/inventory/material-issues", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return response.data;
}

export async function postInventoryMaterialIssue(
  id: string,
  postedByPersonId: string,
): Promise<InventoryMaterialIssue> {
  const response = await apiRequest<
    ApiResponse<InventoryMaterialIssue>
  >(`/inventory/material-issues/${id}/post`, {
    method: "POST",
    body: JSON.stringify({
      postedByPersonId,
    }),
  });

  return response.data;
}

export async function cancelInventoryMaterialIssue(
  id: string,
  cancelledByPersonId: string,
  cancellationReason: string,
): Promise<InventoryMaterialIssue> {
  const response = await apiRequest<
    ApiResponse<InventoryMaterialIssue>
  >(`/inventory/material-issues/${id}/cancel`, {
    method: "POST",
    body: JSON.stringify({
      cancelledByPersonId,
      cancellationReason,
    }),
  });

  return response.data;
}
