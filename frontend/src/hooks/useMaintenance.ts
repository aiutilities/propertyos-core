"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import {
  ApiResponse,
  AssignMaintenanceTicketInput,
  CreateMaintenanceTicketInput,
  MaintenanceCategory,
  MaintenanceListFilters,
  MaintenanceMetrics,
  MaintenanceTicket,
  TransitionMaintenanceTicketInput,
} from "@/types/maintenance";

function toQueryString(filters: MaintenanceListFilters): string {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });

  const query = params.toString();

  return query ? `?${query}` : "";
}

export function useMaintenance(
  filters: MaintenanceListFilters = {},
) {
  const [items, setItems] = useState<MaintenanceTicket[]>([]);
  const [metrics, setMetrics] = useState<MaintenanceMetrics | null>(
    null,
  );
  const [categories, setCategories] = useState<MaintenanceCategory[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [ticketsResponse, metricsResponse, categoriesResponse] =
        await Promise.all([
          apiRequest<ApiResponse<MaintenanceTicket[]>>(
            `/maintenance${toQueryString(filters)}`,
          ),
          apiRequest<ApiResponse<MaintenanceMetrics>>(
            `/maintenance/metrics${
              filters.propertyId
                ? `?propertyId=${encodeURIComponent(
                    filters.propertyId,
                  )}`
                : ""
            }`,
          ),
          apiRequest<ApiResponse<MaintenanceCategory[]>>(
            "/maintenance/categories",
          ),
        ]);

      setItems(ticketsResponse.data ?? []);
      setMetrics(metricsResponse.data ?? null);
      setCategories(categoriesResponse.data ?? []);
    } catch (err) {
      setItems([]);
      setMetrics(null);
      setCategories([]);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load maintenance data.",
      );
    } finally {
      setLoading(false);
    }
  }, [
    filters.propertyId,
    filters.spaceId,
    filters.reporterPersonId,
    filters.assigneePersonId,
    filters.categoryId,
    filters.priority,
    filters.status,
    filters.search,
  ]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    items,
    metrics,
    categories,
    loading,
    error,
    refresh,
  };
}

export async function getMaintenanceTicket(
  id: string,
): Promise<MaintenanceTicket> {
  const response = await apiRequest<ApiResponse<MaintenanceTicket>>(
    `/maintenance/${id}`,
  );

  return response.data;
}

export async function createMaintenanceTicket(
  input: CreateMaintenanceTicketInput,
): Promise<MaintenanceTicket> {
  const response = await apiRequest<ApiResponse<MaintenanceTicket>>(
    "/maintenance",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );

  return response.data;
}

export async function assignMaintenanceTicket(
  id: string,
  input: AssignMaintenanceTicketInput,
): Promise<MaintenanceTicket> {
  const response = await apiRequest<ApiResponse<MaintenanceTicket>>(
    `/maintenance/${id}/assign`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );

  return response.data;
}

export async function transitionMaintenanceTicket(
  id: string,
  input: TransitionMaintenanceTicketInput,
): Promise<MaintenanceTicket> {
  const response = await apiRequest<ApiResponse<MaintenanceTicket>>(
    `/maintenance/${id}/transition`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );

  return response.data;
}
