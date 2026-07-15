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
  ComparisonRfq,
  ProcurementQuotationComparison,
} from "@/types/quotationComparison";

export function useQuotationComparison() {
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
            : "Quotation comparison request failed";

        setError(message);
        throw caught;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const listComparableRfqs =
    useCallback(
      () =>
        execute(
          async () => {
            const statuses = [
              "OPEN",
              "CLOSED",
              "AWARDED",
            ];

            const responses =
              await Promise.all(
                statuses.map(
                  async (status) =>
                    (
                      await apiRequest<
                        ApiSuccessResponse<
                          ComparisonRfq[]
                        >
                      >(
                        `/procurement/rfqs?status=${status}`,
                      )
                    ).data,
                ),
              );

            const unique = new Map<
              string,
              ComparisonRfq
            >();

            responses
              .flat()
              .forEach(
                (rfq) =>
                  unique.set(
                    rfq.id,
                    rfq,
                  ),
              );

            return Array.from(
              unique.values(),
            ).sort(
              (
                first,
                second,
              ) =>
                first.rfqNumber.localeCompare(
                  second.rfqNumber,
                ),
            );
          },
        ),
      [execute],
    );

  const getComparison =
    useCallback(
      (
        rfqId: string,
      ) =>
        execute(
          async () =>
            (
              await apiRequest<
                ApiSuccessResponse<
                  ProcurementQuotationComparison
                >
              >(
                `/procurement/rfqs/${rfqId}/comparison`,
              )
            ).data,
        ),
      [execute],
    );

  const decideQuotation =
    useCallback(
      (
        quotationId: string,
        action:
          | "select"
          | "reject",
        changedByPersonId: string,
        remarks?: string,
      ) =>
        execute(
          async () =>
            apiRequest(
              `/procurement/quotations/${quotationId}/${action}`,
              {
                method: "POST",
                body: JSON.stringify({
                  changedByPersonId,
                  remarks:
                    remarks?.trim() ||
                    undefined,
                }),
              },
            ),
        ),
      [execute],
    );

  return {
    loading,
    error,
    listComparableRfqs,
    getComparison,
    decideQuotation,
  };
}
