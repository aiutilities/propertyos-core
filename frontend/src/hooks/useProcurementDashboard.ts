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
  ProcurementDashboardData,
  ProcurementDashboardGoodsReceipt,
  ProcurementDashboardInvoiceMatch,
  ProcurementDashboardPaymentRequest,
  ProcurementDashboardPurchaseOrder,
  ProcurementDashboardPurchaseRequest,
  ProcurementDashboardQuotation,
  ProcurementDashboardRfq,
} from "@/types/procurementDashboard";

export function useProcurementDashboard() {
  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  const loadDashboard = useCallback(
    async (): Promise<ProcurementDashboardData> => {
      setLoading(true);
      setError(null);

      try {
        const [
          purchaseRequests,
          rfqs,
          quotations,
          purchaseOrders,
          goodsReceipts,
          invoiceMatches,
          paymentRequests,
        ] = await Promise.all([
          apiRequest<
            ApiSuccessResponse<
              ProcurementDashboardPurchaseRequest[]
            >
          >(
            "/procurement/requests",
          ),
          apiRequest<
            ApiSuccessResponse<
              ProcurementDashboardRfq[]
            >
          >(
            "/procurement/rfqs",
          ),
          apiRequest<
            ApiSuccessResponse<
              ProcurementDashboardQuotation[]
            >
          >(
            "/procurement/quotations",
          ),
          apiRequest<
            ApiSuccessResponse<
              ProcurementDashboardPurchaseOrder[]
            >
          >(
            "/procurement/purchase-orders",
          ),
          apiRequest<
            ApiSuccessResponse<
              ProcurementDashboardGoodsReceipt[]
            >
          >(
            "/procurement/goods-receipts",
          ),
          apiRequest<
            ApiSuccessResponse<
              ProcurementDashboardInvoiceMatch[]
            >
          >(
            "/procurement/invoice-matches",
          ),
          apiRequest<
            ApiSuccessResponse<
              ProcurementDashboardPaymentRequest[]
            >
          >(
            "/procurement/payment-requests",
          ),
        ]);

        return {
          purchaseRequests:
            purchaseRequests.data,
          rfqs:
            rfqs.data,
          quotations:
            quotations.data,
          purchaseOrders:
            purchaseOrders.data,
          goodsReceipts:
            goodsReceipts.data,
          invoiceMatches:
            invoiceMatches.data,
          paymentRequests:
            paymentRequests.data,
        };
      } catch (caught) {
        const message =
          caught instanceof Error
            ? caught.message
            : "Unable to load Procurement dashboard";

        setError(message);
        throw caught;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    loading,
    error,
    loadDashboard,
  };
}
