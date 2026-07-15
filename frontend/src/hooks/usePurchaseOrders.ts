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
  CreatePurchaseOrderInput,
  PurchaseOrder,
  PurchaseOrderDetails,
  PurchaseOrderFilters,
  SelectedQuotation,
} from "@/types/purchaseOrder";

function buildQuery(
  filters: Record<
    string,
    string | undefined
  >,
) {
  const params =
    new URLSearchParams();

  Object.entries(
    filters,
  ).forEach(
    (
      [
        key,
        value,
      ],
    ) => {
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

export function usePurchaseOrders() {
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
            : "Purchase Order request failed";

        setError(message);
        throw caught;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const listPurchaseOrders =
    useCallback(
      (
        filters:
          PurchaseOrderFilters = {},
      ) =>
        execute(
          async () =>
            (
              await apiRequest<
                ApiSuccessResponse<
                  PurchaseOrder[]
                >
              >(
                `/procurement/purchase-orders${buildQuery(
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
                  PurchaseOrderDetails
                >
              >(
                `/procurement/purchase-orders/${id}`,
              )
            ).data,
        ),
      [execute],
    );

  const listSelectedQuotations =
    useCallback(
      () =>
        execute(
          async () =>
            (
              await apiRequest<
                ApiSuccessResponse<
                  SelectedQuotation[]
                >
              >(
                "/procurement/quotations?status=SELECTED",
              )
            ).data,
        ),
      [execute],
    );

  const createPurchaseOrder =
    useCallback(
      (
        input:
          CreatePurchaseOrderInput,
      ) =>
        execute(
          async () =>
            (
              await apiRequest<
                ApiSuccessResponse<
                  PurchaseOrderDetails
                >
              >(
                "/procurement/purchase-orders",
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

  const transitionPurchaseOrder =
    useCallback(
      (
        id: string,
        action:
          | "submit"
          | "approve"
          | "issue"
          | "acknowledge"
          | "received"
          | "close"
          | "cancel",
        changedByPersonId: string,
        remarks?: string,
      ) =>
        execute(
          async () =>
            (
              await apiRequest<
                ApiSuccessResponse<
                  PurchaseOrderDetails
                >
              >(
                `/procurement/purchase-orders/${id}/${action}`,
                {
                  method: "POST",
                  body:
                    JSON.stringify({
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
    listPurchaseOrders,
    getPurchaseOrder,
    listSelectedQuotations,
    createPurchaseOrder,
    transitionPurchaseOrder,
  };
}
