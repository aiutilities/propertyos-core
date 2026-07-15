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
  CreateInvoiceMatchInput,
  InvoiceMatch,
  InvoiceMatchDetails,
  InvoiceMatchFilters,
  InvoiceMatchGoodsReceipt,
  InvoiceMatchPurchaseOrder,
} from "@/types/invoiceMatch";

function buildQuery(
  filters: Record<
    string,
    string | undefined
  >,
) {
  const params =
    new URLSearchParams();

  Object.entries(filters).forEach(
    ([key, value]) => {
      if (value) {
        params.set(
          key,
          value,
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

export function useInvoiceMatches() {
  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

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
            : "Invoice Match request failed";

        setError(message);
        throw caught;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const listInvoiceMatches =
    useCallback(
      (
        filters:
          InvoiceMatchFilters = {},
      ) =>
        execute(
          async () =>
            (
              await apiRequest<
                ApiSuccessResponse<
                  InvoiceMatch[]
                >
              >(
                `/procurement/invoice-matches${buildQuery(
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

  const getInvoiceMatch =
    useCallback(
      (
        id: string,
      ) =>
        execute(
          async () =>
            (
              await apiRequest<
                ApiSuccessResponse<
                  InvoiceMatchDetails
                >
              >(
                `/procurement/invoice-matches/${id}`,
              )
            ).data,
        ),
      [execute],
    );

  const listMatchablePurchaseOrders =
    useCallback(
      () =>
        execute(
          async () => {
            const statuses = [
              "PARTIALLY_RECEIVED",
              "RECEIVED",
              "CLOSED",
            ];

            const responses =
              await Promise.all(
                statuses.map(
                  async (status) =>
                    (
                      await apiRequest<
                        ApiSuccessResponse<
                          InvoiceMatchPurchaseOrder[]
                        >
                      >(
                        `/procurement/purchase-orders?status=${status}`,
                      )
                    ).data,
                ),
              );

            const unique = new Map<
              string,
              InvoiceMatchPurchaseOrder
            >();

            responses
              .flat()
              .forEach(
                (order) =>
                  unique.set(
                    order.id,
                    order,
                  ),
              );

            return Array.from(
              unique.values(),
            );
          },
        ),
      [execute],
    );

  const getPurchaseOrder =
    useCallback(
      (
        id: string,
      ) =>
        execute(
          async () =>
            (
              await apiRequest<
                ApiSuccessResponse<
                  InvoiceMatchPurchaseOrder
                >
              >(
                `/procurement/purchase-orders/${id}`,
              )
            ).data,
        ),
      [execute],
    );

  const listPostedGoodsReceipts =
    useCallback(
      (
        purchaseOrderId: string,
      ) =>
        execute(
          async () =>
            (
              await apiRequest<
                ApiSuccessResponse<
                  InvoiceMatchGoodsReceipt[]
                >
              >(
                `/procurement/goods-receipts?purchaseOrderId=${purchaseOrderId}&status=POSTED`,
              )
            ).data,
        ),
      [execute],
    );

  const getGoodsReceipt =
    useCallback(
      (
        id: string,
      ) =>
        execute(
          async () =>
            (
              await apiRequest<
                ApiSuccessResponse<
                  InvoiceMatchGoodsReceipt
                >
              >(
                `/procurement/goods-receipts/${id}`,
              )
            ).data,
        ),
      [execute],
    );

  const createInvoiceMatch =
    useCallback(
      (
        input:
          CreateInvoiceMatchInput,
      ) =>
        execute(
          async () =>
            (
              await apiRequest<
                ApiSuccessResponse<
                  InvoiceMatchDetails
                >
              >(
                "/procurement/invoice-matches",
                {
                  method: "POST",
                  body:
                    JSON.stringify(
                      input,
                    ),
                },
              )
            ).data,
        ),
      [execute],
    );

  const completeInvoiceMatch =
    useCallback(
      (
        id: string,
        matchedByPersonId: string,
        remarks?: string,
      ) =>
        execute(
          async () =>
            (
              await apiRequest<
                ApiSuccessResponse<
                  InvoiceMatchDetails
                >
              >(
                `/procurement/invoice-matches/${id}/complete`,
                {
                  method: "POST",
                  body:
                    JSON.stringify({
                      matchedByPersonId,
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

  const approveInvoiceMatch =
    useCallback(
      (
        id: string,
        approvedByPersonId: string,
        remarks?: string,
      ) =>
        execute(
          async () =>
            (
              await apiRequest<
                ApiSuccessResponse<
                  InvoiceMatchDetails
                >
              >(
                `/procurement/invoice-matches/${id}/approve`,
                {
                  method: "POST",
                  body:
                    JSON.stringify({
                      approvedByPersonId,
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

  const rejectInvoiceMatch =
    useCallback(
      (
        id: string,
        rejectedByPersonId: string,
        rejectionReason: string,
      ) =>
        execute(
          async () =>
            (
              await apiRequest<
                ApiSuccessResponse<
                  InvoiceMatchDetails
                >
              >(
                `/procurement/invoice-matches/${id}/reject`,
                {
                  method: "POST",
                  body:
                    JSON.stringify({
                      rejectedByPersonId,
                      rejectionReason,
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
    listInvoiceMatches,
    getInvoiceMatch,
    listMatchablePurchaseOrders,
    getPurchaseOrder,
    listPostedGoodsReceipts,
    getGoodsReceipt,
    createInvoiceMatch,
    completeInvoiceMatch,
    approveInvoiceMatch,
    rejectInvoiceMatch,
  };
}
