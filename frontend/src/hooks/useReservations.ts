"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { apiRequest } from "@/lib/api";
import {
  ApiResponse,
  ApproveReservationInput,
  AvailabilityInput,
  AvailabilityResult,
  CancelReservationInput,
  CreateReservationInput,
  CreateReservationResourceBlockInput,
  CreateReservationResourceInput,
  RejectReservationInput,
  Reservation,
  ReservationFilters,
  ReservationMetrics,
  ReservationResource,
  ReservationResourceBlock,
  ReservationResourceFilters,
  TransitionReservationInput,
  UpdateReservationResourceInput,
} from "@/types/reservation";

function queryString(
  filters:
    | ReservationFilters
    | ReservationResourceFilters,
): string {
  const params = new URLSearchParams();

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

  const query = params.toString();

  return query ? `?${query}` : "";
}

export function useReservations(
  filters: ReservationFilters = {},
) {
  const [
    reservations,
    setReservations,
  ] = useState<Reservation[]>([]);

  const [
    metrics,
    setMetrics,
  ] = useState<ReservationMetrics | null>(
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

  const refresh = useCallback(
    async () => {
      setLoading(true);
      setError("");

      try {
        const [
          reservationsResponse,
          metricsResponse,
        ] = await Promise.all([
          apiRequest<
            ApiResponse<Reservation[]>
          >(
            `/reservations${queryString(
              filters,
            )}`,
          ),
          apiRequest<
            ApiResponse<ReservationMetrics>
          >(
            `/reservations/metrics${
              filters.propertyId
                ? `?propertyId=${encodeURIComponent(
                    filters.propertyId,
                  )}`
                : ""
            }`,
          ),
        ]);

        setReservations(
          reservationsResponse.data ?? [],
        );

        setMetrics(
          metricsResponse.data ?? null,
        );
      } catch (err) {
        setReservations([]);
        setMetrics(null);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load reservations.",
        );
      } finally {
        setLoading(false);
      }
    },
    [
      filters.propertyId,
      filters.resourceId,
      filters.requesterPersonId,
      filters.beneficiaryPersonId,
      filters.status,
      filters.startsFrom,
      filters.startsUntil,
      filters.search,
    ],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    reservations,
    metrics,
    loading,
    error,
    refresh,
  };
}

export function useReservationResources(
  filters: ReservationResourceFilters = {},
) {
  const [
    resources,
    setResources,
  ] = useState<ReservationResource[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const refresh = useCallback(
    async () => {
      setLoading(true);
      setError("");

      try {
        const response = await apiRequest<
          ApiResponse<ReservationResource[]>
        >(
          `/reservations/resources${queryString(
            filters,
          )}`,
        );

        setResources(
          response.data ?? [],
        );
      } catch (err) {
        setResources([]);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load booking resources.",
        );
      } finally {
        setLoading(false);
      }
    },
    [
      filters.propertyId,
      filters.zoneId,
      filters.spaceId,
      filters.resourceType,
      filters.isActive,
      filters.search,
    ],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    resources,
    loading,
    error,
    refresh,
  };
}

export async function getReservation(
  id: string,
): Promise<Reservation> {
  const response = await apiRequest<
    ApiResponse<Reservation>
  >(`/reservations/${id}`);

  return response.data;
}

export async function createReservation(
  input: CreateReservationInput,
): Promise<Reservation> {
  const response = await apiRequest<
    ApiResponse<Reservation>
  >("/reservations", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return response.data;
}

export async function approveReservation(
  id: string,
  input: ApproveReservationInput,
): Promise<Reservation> {
  const response = await apiRequest<
    ApiResponse<Reservation>
  >(`/reservations/${id}/approve`, {
    method: "POST",
    body: JSON.stringify(input),
  });

  return response.data;
}

export async function rejectReservation(
  id: string,
  input: RejectReservationInput,
): Promise<Reservation> {
  const response = await apiRequest<
    ApiResponse<Reservation>
  >(`/reservations/${id}/reject`, {
    method: "POST",
    body: JSON.stringify(input),
  });

  return response.data;
}

export async function cancelReservation(
  id: string,
  input: CancelReservationInput,
): Promise<Reservation> {
  const response = await apiRequest<
    ApiResponse<Reservation>
  >(`/reservations/${id}/cancel`, {
    method: "POST",
    body: JSON.stringify(input),
  });

  return response.data;
}

async function transitionReservation(
  id: string,
  action:
    | "check-in"
    | "complete"
    | "no-show",
  input: TransitionReservationInput,
): Promise<Reservation> {
  const response = await apiRequest<
    ApiResponse<Reservation>
  >(`/reservations/${id}/${action}`, {
    method: "POST",
    body: JSON.stringify(input),
  });

  return response.data;
}

export function checkInReservation(
  id: string,
  input: TransitionReservationInput,
) {
  return transitionReservation(
    id,
    "check-in",
    input,
  );
}

export function completeReservation(
  id: string,
  input: TransitionReservationInput,
) {
  return transitionReservation(
    id,
    "complete",
    input,
  );
}

export function markReservationNoShow(
  id: string,
  input: TransitionReservationInput,
) {
  return transitionReservation(
    id,
    "no-show",
    input,
  );
}

export async function checkAvailability(
  input: AvailabilityInput,
): Promise<AvailabilityResult> {
  const response = await apiRequest<
    ApiResponse<AvailabilityResult>
  >("/reservations/availability", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return response.data;
}

export async function getReservationResource(
  id: string,
): Promise<ReservationResource> {
  const response = await apiRequest<
    ApiResponse<ReservationResource>
  >(`/reservations/resources/${id}`);

  return response.data;
}

export async function createReservationResource(
  input: CreateReservationResourceInput,
): Promise<ReservationResource> {
  const response = await apiRequest<
    ApiResponse<ReservationResource>
  >("/reservations/resources", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return response.data;
}

export async function updateReservationResource(
  id: string,
  input: UpdateReservationResourceInput,
): Promise<ReservationResource> {
  const response = await apiRequest<
    ApiResponse<ReservationResource>
  >(`/reservations/resources/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

  return response.data;
}

export async function listReservationResourceBlocks(
  resourceId: string,
  startsFrom?: string,
  startsUntil?: string,
): Promise<ReservationResourceBlock[]> {
  const params = new URLSearchParams();

  if (startsFrom) {
    params.set(
      "startsFrom",
      startsFrom,
    );
  }

  if (startsUntil) {
    params.set(
      "startsUntil",
      startsUntil,
    );
  }

  const query = params.toString();

  const response = await apiRequest<
    ApiResponse<ReservationResourceBlock[]>
  >(
    `/reservations/resources/${resourceId}/blocks${
      query ? `?${query}` : ""
    }`,
  );

  return response.data;
}

export async function createReservationResourceBlock(
  resourceId: string,
  input: CreateReservationResourceBlockInput,
): Promise<ReservationResourceBlock> {
  const response = await apiRequest<
    ApiResponse<ReservationResourceBlock>
  >(
    `/reservations/resources/${resourceId}/blocks`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );

  return response.data;
}
