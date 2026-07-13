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
  AddHelpdeskCommentInput,
  AddHelpdeskWorklogInput,
  AssignHelpdeskTicketInput,
  CreateHelpdeskTicketInput,
  HelpdeskApiResponse,
  HelpdeskCategory,
  HelpdeskComment,
  HelpdeskFeedback,
  HelpdeskListFilters,
  HelpdeskMetrics,
  HelpdeskTicket,
  HelpdeskWorklog,
  ResolveHelpdeskTicketInput,
  SubmitHelpdeskFeedbackInput,
  TransitionHelpdeskTicketInput,
} from "@/types/helpdesk";

function toQueryString(
  filters: HelpdeskListFilters,
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

export function useHelpdesk(
  filters: HelpdeskListFilters = {},
) {
  const [
    items,
    setItems,
  ] = useState<HelpdeskTicket[]>([]);

  const [
    metrics,
    setMetrics,
  ] = useState<HelpdeskMetrics | null>(
    null,
  );

  const [
    categories,
    setCategories,
  ] = useState<HelpdeskCategory[]>([]);

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
          ticketsResponse,
          metricsResponse,
          categoriesResponse,
        ] = await Promise.all([
          apiRequest<
            HelpdeskApiResponse<
              HelpdeskTicket[]
            >
          >(
            `/helpdesk${toQueryString(
              filters,
            )}`,
          ),

          apiRequest<
            HelpdeskApiResponse<
              HelpdeskMetrics
            >
          >(
            `/helpdesk/metrics${
              filters.propertyId
                ? `?propertyId=${encodeURIComponent(
                    filters.propertyId,
                  )}`
                : ""
            }`,
          ),

          apiRequest<
            HelpdeskApiResponse<
              HelpdeskCategory[]
            >
          >(
            "/helpdesk/categories",
          ),
        ]);

        setItems(
          ticketsResponse.data ?? [],
        );

        setMetrics(
          metricsResponse.data ?? null,
        );

        setCategories(
          categoriesResponse.data ?? [],
        );
      } catch (caught) {
        setItems([]);
        setMetrics(null);
        setCategories([]);

        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to load helpdesk data.",
        );
      } finally {
        setLoading(false);
      }
    }, [
      filters.propertyId,
      filters.spaceId,
      filters.requesterPersonId,
      filters.assigneePersonId,
      filters.categoryId,
      filters.priority,
      filters.status,
      filters.channel,
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

export async function getHelpdeskTicket(
  id: string,
): Promise<HelpdeskTicket> {
  const response =
    await apiRequest<
      HelpdeskApiResponse<
        HelpdeskTicket
      >
    >(
      `/helpdesk/${id}`,
    );

  return response.data;
}

export async function createHelpdeskTicket(
  input: CreateHelpdeskTicketInput,
): Promise<HelpdeskTicket> {
  const response =
    await apiRequest<
      HelpdeskApiResponse<
        HelpdeskTicket
      >
    >(
      "/helpdesk",
      {
        method: "POST",
        body:
          JSON.stringify(input),
      },
    );

  return response.data;
}

export async function assignHelpdeskTicket(
  id: string,
  input: AssignHelpdeskTicketInput,
): Promise<HelpdeskTicket> {
  const response =
    await apiRequest<
      HelpdeskApiResponse<
        HelpdeskTicket
      >
    >(
      `/helpdesk/${id}/assign`,
      {
        method: "POST",
        body:
          JSON.stringify(input),
      },
    );

  return response.data;
}

async function transitionHelpdeskTicket(
  id: string,
  action: string,
  input:
    | TransitionHelpdeskTicketInput
    | ResolveHelpdeskTicketInput,
): Promise<HelpdeskTicket> {
  const response =
    await apiRequest<
      HelpdeskApiResponse<
        HelpdeskTicket
      >
    >(
      `/helpdesk/${id}/${action}`,
      {
        method: "POST",
        body:
          JSON.stringify(input),
      },
    );

  return response.data;
}

export function startHelpdeskProgress(
  id: string,
  input: TransitionHelpdeskTicketInput,
) {
  return transitionHelpdeskTicket(
    id,
    "start-progress",
    input,
  );
}

export function escalateHelpdeskTicket(
  id: string,
  input: TransitionHelpdeskTicketInput,
) {
  return transitionHelpdeskTicket(
    id,
    "escalate",
    input,
  );
}

export function resolveHelpdeskTicket(
  id: string,
  input: ResolveHelpdeskTicketInput,
) {
  return transitionHelpdeskTicket(
    id,
    "resolve",
    input,
  );
}

export function reopenHelpdeskTicket(
  id: string,
  input: TransitionHelpdeskTicketInput,
) {
  return transitionHelpdeskTicket(
    id,
    "reopen",
    input,
  );
}

export function closeHelpdeskTicket(
  id: string,
  input: TransitionHelpdeskTicketInput,
) {
  return transitionHelpdeskTicket(
    id,
    "close",
    input,
  );
}

export function cancelHelpdeskTicket(
  id: string,
  input: TransitionHelpdeskTicketInput,
) {
  return transitionHelpdeskTicket(
    id,
    "cancel",
    input,
  );
}

export async function addHelpdeskComment(
  id: string,
  input: AddHelpdeskCommentInput,
): Promise<HelpdeskComment> {
  const response =
    await apiRequest<
      HelpdeskApiResponse<
        HelpdeskComment
      >
    >(
      `/helpdesk/${id}/comments`,
      {
        method: "POST",
        body:
          JSON.stringify(input),
      },
    );

  return response.data;
}

export async function addHelpdeskWorklog(
  id: string,
  input: AddHelpdeskWorklogInput,
): Promise<HelpdeskWorklog> {
  const response =
    await apiRequest<
      HelpdeskApiResponse<
        HelpdeskWorklog
      >
    >(
      `/helpdesk/${id}/worklogs`,
      {
        method: "POST",
        body:
          JSON.stringify(input),
      },
    );

  return response.data;
}

export async function submitHelpdeskFeedback(
  id: string,
  input: SubmitHelpdeskFeedbackInput,
): Promise<HelpdeskFeedback> {
  const response =
    await apiRequest<
      HelpdeskApiResponse<
        HelpdeskFeedback
      >
    >(
      `/helpdesk/${id}/feedback`,
      {
        method: "POST",
        body:
          JSON.stringify(input),
      },
    );

  return response.data;
}
