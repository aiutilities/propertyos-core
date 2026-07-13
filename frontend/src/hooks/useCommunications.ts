"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  apiRequest,
} from "@/lib/api";

import {
  Communication,
  CommunicationApiResponse,
  CommunicationCategory,
  CommunicationDetails,
  CommunicationEngagementMetrics,
  CommunicationFilters,
  CommunicationMetrics,
  CommunicationRead,
  CreateCommunicationInput,
  ScheduleCommunicationInput,
  TransitionCommunicationInput,
  UpdateCommunicationInput,
} from "@/types/communication";

function queryString(
  filters: CommunicationFilters,
): string {
  const params =
    new URLSearchParams();

  Object.entries(filters).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== ""
      ) {
        params.set(
          key,
          String(value),
        );
      }
    },
  );

  const query =
    params.toString();

  return query
    ? `?${query}`
    : "";
}

export function useCommunications(
  filters: CommunicationFilters = {},
) {
  const [
    items,
    setItems,
  ] = useState<Communication[]>([]);

  const [
    categories,
    setCategories,
  ] = useState<CommunicationCategory[]>([]);

  const [
    metrics,
    setMetrics,
  ] = useState<CommunicationMetrics | null>(
    null,
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const refresh =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const [
          communicationsResponse,
          categoriesResponse,
          metricsResponse,
        ] = await Promise.all([
          apiRequest<
            CommunicationApiResponse<
              Communication[]
            >
          >(
            `/communications${queryString(
              filters,
            )}`,
          ),

          apiRequest<
            CommunicationApiResponse<
              CommunicationCategory[]
            >
          >(
            "/communications/categories",
          ),

          apiRequest<
            CommunicationApiResponse<
              CommunicationMetrics
            >
          >(
            `/communications/metrics${
              filters.propertyId
                ? `?propertyId=${encodeURIComponent(
                    filters.propertyId,
                  )}`
                : ""
            }`,
          ),
        ]);

        setItems(
          communicationsResponse.data ?? [],
        );

        setCategories(
          categoriesResponse.data ?? [],
        );

        setMetrics(
          metricsResponse.data ?? null,
        );
      } catch (caught) {
        setItems([]);
        setCategories([]);
        setMetrics(null);

        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to load communications.",
        );
      } finally {
        setLoading(false);
      }
    }, [
      filters.propertyId,
      filters.categoryId,
      filters.type,
      filters.priority,
      filters.status,
      filters.createdByPersonId,
      filters.isPinned,
      filters.search,
    ]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    items,
    categories,
    metrics,
    loading,
    error,
    refresh,
  };
}

export async function getCommunication(
  id: string,
): Promise<CommunicationDetails> {
  const response =
    await apiRequest<
      CommunicationApiResponse<
        CommunicationDetails
      >
    >(
      `/communications/${id}`,
    );

  return response.data;
}

export async function createCommunication(
  input: CreateCommunicationInput,
): Promise<Communication> {
  const response =
    await apiRequest<
      CommunicationApiResponse<
        Communication
      >
    >(
      "/communications",
      {
        method: "POST",
        body:
          JSON.stringify(input),
      },
    );

  return response.data;
}

export async function updateCommunication(
  id: string,
  input: UpdateCommunicationInput,
): Promise<Communication> {
  const response =
    await apiRequest<
      CommunicationApiResponse<
        Communication
      >
    >(
      `/communications/${id}`,
      {
        method: "PATCH",
        body:
          JSON.stringify(input),
      },
    );

  return response.data;
}

export async function scheduleCommunication(
  id: string,
  input: ScheduleCommunicationInput,
): Promise<Communication> {
  const response =
    await apiRequest<
      CommunicationApiResponse<
        Communication
      >
    >(
      `/communications/${id}/schedule`,
      {
        method: "POST",
        body:
          JSON.stringify(input),
      },
    );

  return response.data;
}

async function transitionCommunication(
  id: string,
  action: string,
  input: TransitionCommunicationInput,
): Promise<Communication> {
  const response =
    await apiRequest<
      CommunicationApiResponse<
        Communication
      >
    >(
      `/communications/${id}/${action}`,
      {
        method: "POST",
        body:
          JSON.stringify(input),
      },
    );

  return response.data;
}

export function publishCommunication(
  id: string,
  input: TransitionCommunicationInput,
) {
  return transitionCommunication(
    id,
    "publish",
    input,
  );
}

export function expireCommunication(
  id: string,
  input: TransitionCommunicationInput,
) {
  return transitionCommunication(
    id,
    "expire",
    input,
  );
}

export function archiveCommunication(
  id: string,
  input: TransitionCommunicationInput,
) {
  return transitionCommunication(
    id,
    "archive",
    input,
  );
}

export function cancelCommunication(
  id: string,
  input: TransitionCommunicationInput,
) {
  return transitionCommunication(
    id,
    "cancel",
    input,
  );
}

export async function markCommunicationRead(
  id: string,
  personId: string,
): Promise<CommunicationRead> {
  const response =
    await apiRequest<
      CommunicationApiResponse<
        CommunicationRead
      >
    >(
      `/communications/${id}/read`,
      {
        method: "POST",
        body:
          JSON.stringify({
            personId,
          }),
      },
    );

  return response.data;
}

export async function acknowledgeCommunication(
  id: string,
  personId: string,
): Promise<CommunicationRead> {
  const response =
    await apiRequest<
      CommunicationApiResponse<
        CommunicationRead
      >
    >(
      `/communications/${id}/acknowledge`,
      {
        method: "POST",
        body:
          JSON.stringify({
            personId,
          }),
      },
    );

  return response.data;
}

export async function getCommunicationEngagement(
  id: string,
): Promise<CommunicationEngagementMetrics> {
  const response =
    await apiRequest<
      CommunicationApiResponse<
        CommunicationEngagementMetrics
      >
    >(
      `/communications/${id}/engagement`,
    );

  return response.data;
}
