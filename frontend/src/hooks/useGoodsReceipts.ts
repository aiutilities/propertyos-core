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
  CreateGoodsReceiptInput,
  GoodsReceipt,
  GoodsReceiptDetails,
  GoodsReceiptFilters,
  ReceivablePurchaseOrder,
} from "@/types/goodsReceipt";

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

export function useGoodsReceipts() {
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
            : "Goods Receipt request failed";

        setError(message);
        throw caught;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const listGoodsReceipts =
    useCallback(
      (
        filters:
          GoodsReceiptFilters = {},
      ) =>
        execute(
          async () =>
            (
              await apiRequest<
                ApiSuccessResponse<
                  GoodsReceipt[]
                >
              >(
                `/procurement/goods-receipts${buildQuery(
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
                  GoodsReceiptDetails
                >
              >(
                `/procurement/goods-receipts/${id}`,
              )
            ).data,
        ),
      [execute],
    );

  const listReceivablePurchaseOrders =
    useCallback(
      () =>
        execute(
          async () => {
            const statuses = [
              "ISSUED",
              "ACKNOWLEDGED",
              "PARTIALLY_RECEIVED",
            ];

            const responses =
              await Promise.all(
                statuses.map(
                  async (status) =>
                    (
                      await apiRequest<
                        ApiSuccessResponse<
                          ReceivablePurchaseOrder[]
                        >
                      >(
                        `/procurement/purchase-orders?status=${status}`,
                      )
                    ).data,
                ),
              );

            const unique = new Map<
              string,
              ReceivablePurchaseOrder
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
                  ReceivablePurchaseOrder
                >
              >(
                `/procurement/purchase-orders/${id}`,
              )
            ).data,
        ),
      [execute],
    );

  const createGoodsReceipt =
    useCallback(
      (
        input:
          CreateGoodsReceiptInput,
      ) =>
        execute(
          async () =>
            (
              await apiRequest<
                ApiSuccessResponse<
                  GoodsReceiptDetails
                >
              >(
                "/procurement/goods-receipts",
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

  const postGoodsReceipt =
    useCallback(
      (
        id: string,
        postedByPersonId: string,
        remarks?: string,
      ) =>
        execute(
          async () =>
            (
              await apiRequest<
                ApiSuccessResponse<
                  GoodsReceiptDetails
                >
              >(
                `/procurement/goods-receipts/${id}/post`,
                {
                  method: "POST",
                  body:
                    JSON.stringify({
                      changedByPersonId:
                        postedByPersonId,
                      postedByPersonId,
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
    listGoodsReceipts,
    getGoodsReceipt,
    listReceivablePurchaseOrders,
    getPurchaseOrder,
    createGoodsReceipt,
    postGoodsReceipt,
  };
}
