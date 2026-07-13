"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import {
  ApiResponse,
  AssetCategory,
  AssetStatus,
  CreateFacilityAssetInput,
  FacilityAsset,
  FacilityFilters,
  FacilityMetrics,
  PreventiveMaintenanceFrequency,
  PreventiveMaintenancePlan,
} from "@/types/facility";

function queryString(filters: FacilityFilters): string {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  return query ? `?${query}` : "";
}

export function useFacilities(
  filters: FacilityFilters = {},
) {
  const [assets, setAssets] = useState<FacilityAsset[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [metrics, setMetrics] = useState<FacilityMetrics | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [assetsResponse, categoriesResponse, metricsResponse] =
        await Promise.all([
          apiRequest<ApiResponse<FacilityAsset[]>>(
            `/facilities/assets${queryString(filters)}`,
          ),
          apiRequest<ApiResponse<AssetCategory[]>>(
            "/facilities/categories",
          ),
          apiRequest<ApiResponse<FacilityMetrics>>(
            `/facilities/assets/metrics${
              filters.propertyId
                ? `?propertyId=${encodeURIComponent(
                    filters.propertyId,
                  )}`
                : ""
            }`,
          ),
        ]);

      setAssets(assetsResponse.data ?? []);
      setCategories(categoriesResponse.data ?? []);
      setMetrics(metricsResponse.data ?? null);
    } catch (err) {
      setAssets([]);
      setCategories([]);
      setMetrics(null);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load facility assets.",
      );
    } finally {
      setLoading(false);
    }
  }, [
    filters.propertyId,
    filters.zoneId,
    filters.spaceId,
    filters.categoryId,
    filters.status,
    filters.condition,
    filters.search,
  ]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    assets,
    categories,
    metrics,
    loading,
    error,
    refresh,
  };
}

export async function getFacilityAsset(
  id: string,
): Promise<FacilityAsset> {
  const response = await apiRequest<ApiResponse<FacilityAsset>>(
    `/facilities/assets/${id}`,
  );

  return response.data;
}

export async function createFacilityAsset(
  input: CreateFacilityAssetInput,
): Promise<FacilityAsset> {
  const response = await apiRequest<ApiResponse<FacilityAsset>>(
    "/facilities/assets",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );

  return response.data;
}

export async function transitionFacilityAsset(
  id: string,
  status: AssetStatus,
  changedByPersonId: string,
  remarks?: string,
): Promise<FacilityAsset> {
  const response = await apiRequest<ApiResponse<FacilityAsset>>(
    `/facilities/assets/${id}/transition`,
    {
      method: "POST",
      body: JSON.stringify({
        status,
        changedByPersonId,
        remarks,
      }),
    },
  );

  return response.data;
}

export async function createPreventivePlan(
  assetId: string,
  input: {
    name: string;
    description?: string;
    frequency: PreventiveMaintenanceFrequency;
    intervalDays?: number;
    nextDueAt: string;
    assignedPersonId?: string;
    createdByPersonId: string;
  },
): Promise<PreventiveMaintenancePlan> {
  const response = await apiRequest<
    ApiResponse<PreventiveMaintenancePlan>
  >(`/facilities/assets/${assetId}/preventive-plans`, {
    method: "POST",
    body: JSON.stringify(input),
  });

  return response.data;
}
