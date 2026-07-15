"use client";

import { useCallback, useState } from "react";
import { apiRequest } from "@/lib/api";
import type {
  ApiSuccessResponse,
  CreatePurchaseRequestInput,
  ProcurementCategory,
  ProcurementMetrics,
  PurchaseRequest,
  PurchaseRequestDetails,
  PurchaseRequestFilters,
  CreateProcurementRfqInput,
  ProcurementRfq,
  ProcurementRfqDetails,
  ProcurementRfqFilters,
} from "@/types/procurement";

function buildQuery(filters: PurchaseRequestFilters | ProcurementRfqFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function useProcurement() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async <T,>(operation: () => Promise<T>) => {
    setLoading(true);
    setError(null);
    try {
      return await operation();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Procurement request failed";
      setError(message);
      throw caught;
    } finally {
      setLoading(false);
    }
  }, []);

  const listRequests = useCallback((filters: PurchaseRequestFilters = {}) =>
    execute(async () => (await apiRequest<ApiSuccessResponse<PurchaseRequest[]>>(
      `/procurement/requests${buildQuery(filters)}`,
    )).data), [execute]);

  const getRequest = useCallback((id: string) =>
    execute(async () => (await apiRequest<ApiSuccessResponse<PurchaseRequestDetails>>(
      `/procurement/requests/${id}`,
    )).data), [execute]);

  const createRequest = useCallback((input: CreatePurchaseRequestInput) =>
    execute(async () => (await apiRequest<ApiSuccessResponse<PurchaseRequestDetails>>(
      "/procurement/requests",
      { method: "POST", body: JSON.stringify(input) },
    )).data), [execute]);

  const categories = useCallback(() =>
    execute(async () => (await apiRequest<ApiSuccessResponse<ProcurementCategory[]>>(
      "/procurement/categories",
    )).data), [execute]);

  const metrics = useCallback(() =>
    execute(async () => (await apiRequest<ApiSuccessResponse<ProcurementMetrics>>(
      "/procurement/metrics",
    )).data), [execute]);

  const transitionRequest = useCallback((id: string, action: "submit" | "approve" | "cancel" | "close", changedByPersonId: string, remarks?: string) =>
    execute(async () => (await apiRequest<ApiSuccessResponse<PurchaseRequestDetails>>(
      `/procurement/requests/${id}/${action}`,
      { method: "POST", body: JSON.stringify({ changedByPersonId, remarks: remarks || undefined }) },
    )).data), [execute]);

  const listRfqs = useCallback((filters: ProcurementRfqFilters = {}) =>
    execute(async () => (await apiRequest<ApiSuccessResponse<ProcurementRfq[]>>(
      `/procurement/rfqs${buildQuery(filters)}`,
    )).data), [execute]);

  const getRfq = useCallback((id: string) =>
    execute(async () => (await apiRequest<ApiSuccessResponse<ProcurementRfqDetails>>(
      `/procurement/rfqs/${id}`,
    )).data), [execute]);

  const createRfq = useCallback((input: CreateProcurementRfqInput) =>
    execute(async () => (await apiRequest<ApiSuccessResponse<ProcurementRfqDetails>>(
      "/procurement/rfqs",
      { method: "POST", body: JSON.stringify(input) },
    )).data), [execute]);

  const transitionRfq = useCallback((id: string, action: "issue" | "close" | "cancel" | "expire", changedByPersonId: string, remarks?: string) =>
    execute(async () => (await apiRequest<ApiSuccessResponse<ProcurementRfqDetails>>(
      `/procurement/rfqs/${id}/${action}`,
      { method: "POST", body: JSON.stringify({ changedByPersonId, remarks: remarks || undefined }) },
    )).data), [execute]);

  const rejectRequest = useCallback((id: string, changedByPersonId: string, rejectionReason: string) =>
    execute(async () => (await apiRequest<ApiSuccessResponse<PurchaseRequestDetails>>(
      `/procurement/requests/${id}/reject`,
      { method: "POST", body: JSON.stringify({ changedByPersonId, rejectionReason }) },
    )).data), [execute]);

  return { loading, error, listRequests, getRequest, createRequest, categories, metrics, transitionRequest, rejectRequest, listRfqs, getRfq, createRfq, transitionRfq };
}
