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
  ApprovedInvoiceMatch,
  CreatePaymentRequestInput,
  PaymentRequest,
  PaymentRequestDetails,
  PaymentRequestFilters,
} from "@/types/paymentRequest";

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

  return query ? `?${query}` : "";
}

export function usePaymentRequests() {
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
            : "Payment Request operation failed";

        setError(message);
        throw caught;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const listPaymentRequests = useCallback(
    (
      filters: PaymentRequestFilters = {},
    ) =>
      execute(
        async () =>
          (
            await apiRequest<
              ApiSuccessResponse<PaymentRequest[]>
            >(
              `/procurement/payment-requests${buildQuery(
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

  const getPaymentRequest = useCallback(
    (
      id: string,
    ) =>
      execute(
        async () =>
          (
            await apiRequest<
              ApiSuccessResponse<PaymentRequestDetails>
            >(
              `/procurement/payment-requests/${id}`,
            )
          ).data,
      ),
    [execute],
  );

  const listApprovedInvoiceMatches =
    useCallback(
      () =>
        execute(
          async () =>
            (
              await apiRequest<
                ApiSuccessResponse<ApprovedInvoiceMatch[]>
              >(
                "/procurement/invoice-matches?status=APPROVED",
              )
            ).data,
        ),
      [execute],
    );

  const createPaymentRequest = useCallback(
    (
      input: CreatePaymentRequestInput,
    ) =>
      execute(
        async () =>
          (
            await apiRequest<
              ApiSuccessResponse<PaymentRequestDetails>
            >(
              "/procurement/payment-requests",
              {
                method: "POST",
                body: JSON.stringify(input),
              },
            )
          ).data,
      ),
    [execute],
  );

  const submitPaymentRequest = useCallback(
    (
      id: string,
      submittedByPersonId: string,
      remarks?: string,
    ) =>
      execute(
        async () =>
          (
            await apiRequest<
              ApiSuccessResponse<PaymentRequestDetails>
            >(
              `/procurement/payment-requests/${id}/submit`,
              {
                method: "POST",
                body: JSON.stringify({
                  submittedByPersonId,
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

  const approvePaymentRequest = useCallback(
    (
      id: string,
      approvedByPersonId: string,
      approvedAmount: number,
      remarks?: string,
    ) =>
      execute(
        async () =>
          (
            await apiRequest<
              ApiSuccessResponse<PaymentRequestDetails>
            >(
              `/procurement/payment-requests/${id}/approve`,
              {
                method: "POST",
                body: JSON.stringify({
                  approvedByPersonId,
                  approvedAmount,
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

  const rejectPaymentRequest = useCallback(
    (
      id: string,
      rejectedByPersonId: string,
      rejectionReason: string,
      remarks?: string,
    ) =>
      execute(
        async () =>
          (
            await apiRequest<
              ApiSuccessResponse<PaymentRequestDetails>
            >(
              `/procurement/payment-requests/${id}/reject`,
              {
                method: "POST",
                body: JSON.stringify({
                  rejectedByPersonId,
                  rejectionReason,
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

  const payPaymentRequest = useCallback(
    (
      id: string,
      paidByPersonId: string,
      paidAmount: number,
      paymentReference: string,
      remarks?: string,
    ) =>
      execute(
        async () =>
          (
            await apiRequest<
              ApiSuccessResponse<PaymentRequestDetails>
            >(
              `/procurement/payment-requests/${id}/pay`,
              {
                method: "POST",
                body: JSON.stringify({
                  paidByPersonId,
                  paidAmount,
                  paymentReference,
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

  const cancelPaymentRequest = useCallback(
    (
      id: string,
      cancelledByPersonId: string,
      remarks?: string,
    ) =>
      execute(
        async () =>
          (
            await apiRequest<
              ApiSuccessResponse<PaymentRequestDetails>
            >(
              `/procurement/payment-requests/${id}/cancel`,
              {
                method: "POST",
                body: JSON.stringify({
                  cancelledByPersonId,
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
    listPaymentRequests,
    getPaymentRequest,
    listApprovedInvoiceMatches,
    createPaymentRequest,
    submitPaymentRequest,
    approvePaymentRequest,
    rejectPaymentRequest,
    payPaymentRequest,
    cancelPaymentRequest,
  };
}
