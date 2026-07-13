"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { apiRequest } from "@/lib/api";
import {
  AccessDecision,
  AccessEvent,
  AccessEventType,
  AccessGrant,
  AccessGrantStatus,
  AccessMetrics,
  AccessPoint,
  AccessPointStatus,
  AccessPointType,
  AccessSubjectType,
  ApiResponse,
  CreateAccessGrantInput,
  CreateAccessPointInput,
  EvaluateAccessInput,
  AccessEvaluation,
} from "@/types/access-control";

function queryString(
  input: Record<string, string | number | undefined>,
): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  }

  const query = params.toString();

  return query ? `?${query}` : "";
}

export function useAccessPoints(
  filters: {
    propertyId?: string;
    zoneId?: string;
    spaceId?: string;
    accessPointType?: AccessPointType | "";
    status?: AccessPointStatus | "";
    search?: string;
  } = {},
) {
  const [points, setPoints] = useState<AccessPoint[]>([]);
  const [metrics, setMetrics] = useState<AccessMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const pointQuery = useMemo(
    () => queryString(filters),
    [
      filters.propertyId,
      filters.zoneId,
      filters.spaceId,
      filters.accessPointType,
      filters.status,
      filters.search,
    ],
  );

  const metricsQuery = useMemo(
    () =>
      queryString({
        propertyId: filters.propertyId,
      }),
    [filters.propertyId],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [pointResponse, metricResponse] = await Promise.all([
        apiRequest<ApiResponse<AccessPoint[]>>(
          `/access-control/points${pointQuery}`,
        ),
        apiRequest<ApiResponse<AccessMetrics>>(
          `/access-control/metrics${metricsQuery}`,
        ),
      ]);

      setPoints(pointResponse.data ?? []);
      setMetrics(metricResponse.data ?? null);
    } catch (caught) {
      setPoints([]);
      setMetrics(null);
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load access control.",
      );
    } finally {
      setLoading(false);
    }
  }, [pointQuery, metricsQuery]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    points,
    metrics,
    loading,
    error,
    refresh,
  };
}

export async function getAccessPoint(id: string): Promise<AccessPoint> {
  const response = await apiRequest<ApiResponse<AccessPoint>>(
    `/access-control/points/${id}`,
  );

  return response.data;
}

export async function createAccessPoint(
  input: CreateAccessPointInput,
): Promise<AccessPoint> {
  const response = await apiRequest<ApiResponse<AccessPoint>>(
    "/access-control/points",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );

  return response.data;
}

export async function createAccessGrant(
  input: CreateAccessGrantInput,
): Promise<AccessGrant> {
  const response = await apiRequest<ApiResponse<AccessGrant>>(
    "/access-control/grants",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );

  return response.data;
}

export async function revokeAccessGrant(
  id: string,
  revokedByPersonId: string,
  reason: string,
): Promise<AccessGrant> {
  const response = await apiRequest<ApiResponse<AccessGrant>>(
    `/access-control/grants/${id}/revoke`,
    {
      method: "POST",
      body: JSON.stringify({
        revokedByPersonId,
        reason,
      }),
    },
  );

  return response.data;
}

export async function listAccessGrants(
  filters: {
    accessPointId?: string;
    subjectType?: AccessSubjectType | "";
    subjectId?: string;
    status?: AccessGrantStatus | "";
  } = {},
): Promise<AccessGrant[]> {
  const response = await apiRequest<ApiResponse<AccessGrant[]>>(
    `/access-control/grants${queryString(filters)}`,
  );

  return response.data;
}

export async function listAccessEvents(
  filters: {
    accessPointId?: string;
    propertyId?: string;
    subjectType?: AccessSubjectType | "";
    subjectId?: string;
    eventType?: AccessEventType | "";
    decision?: AccessDecision | "";
    limit?: number;
  } = {},
): Promise<AccessEvent[]> {
  const response = await apiRequest<ApiResponse<AccessEvent[]>>(
    `/access-control/events${queryString(filters)}`,
  );

  return response.data;
}

export async function evaluateAccess(
  input: EvaluateAccessInput,
): Promise<AccessEvaluation> {
  const response = await apiRequest<ApiResponse<AccessEvaluation>>(
    "/access-control/evaluate",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );

  return response.data;
}
