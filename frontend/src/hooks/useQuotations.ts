"use client";

import {
  useCallback,
  useState,
} from "react";

import {
  apiRequest,
} from "@/lib/api";

import type {
  ApiSuccessResponse,
  CreateQuotationInput,
  ProcurementQuotation,
  ProcurementQuotationDetails,
  QuotationFilters,
  QuotationRfq,
  QuotationRfqDetails,
} from "@/types/quotation";

function buildQuery(
  filters: Record<string, string | undefined>,
) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(
    ([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    },
  );

  const query = params.toString();

  return query
    ? `?${query}`
    : "";
}

export function useQuotations() {
  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  const execute = useCallback(
    async <T,>(
      operation: () => Promise<T>,
    ) => {
      setLoading(true);
      setError(null);

      try {
        return await operation();
      } catch (caught) {
        const message =
          caught instanceof Error
            ? caught.message
            : "Quotation request failed";

        setError(message);
        throw caught;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const listQuotations = useCallback(
    (
      filters: QuotationFilters = {},
    ) =>
      execute(
        async () =>
          (
            await apiRequest<
              ApiSuccessResponse<
                ProcurementQuotation[]
              >
            >(
              `/procurement/quotations${buildQuery(
                filters as Record<
                  string,
                  string | undefined
                >,
              )}`,
            )
          ).data,
      ),
    [execute],
  );

  const getQuotation = useCallback(
    (
      id: string,
    ) =>
      execute(
        async () =>
          (
            await apiRequest<
              ApiSuccessResponse<
                ProcurementQuotationDetails
              >
            >(
              `/procurement/quotations/${id}`,
            )
          ).data,
      ),
    [execute],
  );

  const createQuotation = useCallback(
    (
      input: CreateQuotationInput,
    ) =>
      execute(
        async () =>
          (
            await apiRequest<
              ApiSuccessResponse<
                ProcurementQuotationDetails
              >
            >(
              "/procurement/quotations",
              {
                method: "POST",
                body: JSON.stringify(input),
              },
            )
          ).data,
      ),
    [execute],
  );

  const listRfqs = useCallback(
    (
      status?: string,
    ) =>
      execute(
        async () =>
          (
            await apiRequest<
              ApiSuccessResponse<
                QuotationRfq[]
              >
            >(
              `/procurement/rfqs${buildQuery({
                status,
              })}`,
            )
          ).data,
      ),
    [execute],
  );

  const getRfq = useCallback(
    (
      id: string,
    ) =>
      execute(
        async () =>
          (
            await apiRequest<
              ApiSuccessResponse<
                QuotationRfqDetails
              >
            >(
              `/procurement/rfqs/${id}`,
            )
          ).data,
      ),
    [execute],
  );

  const transitionQuotation = useCallback(
    (
      id: string,
      action:
        | "submit"
        | "select"
        | "reject"
        | "withdraw"
        | "expire",
      changedByPersonId: string,
      remarks?: string,
    ) =>
      execute(
        async () =>
          (
            await apiRequest<
              ApiSuccessResponse<
                ProcurementQuotationDetails
              >
            >(
              `/procurement/quotations/${id}/${action}`,
              {
                method: "POST",
                body: JSON.stringify({
                  changedByPersonId,
                  remarks:
                    remarks?.trim() ||
                    undefined,
                }),
              },
            )
          ).data,
      ),
    [execute],
  );

  return {
    loading,
    error,
    listQuotations,
    getQuotation,
    createQuotation,
    listRfqs,
    getRfq,
    transitionQuotation,
  };
}
