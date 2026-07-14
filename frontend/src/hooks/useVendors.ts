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
  CreateVendorInput,
  Vendor,
  VendorCategory,
  VendorDetails,
  VendorFilters,
  VendorContract,
  VendorContractFilters,
  VendorMetrics,
  VendorRatingSummary,
  VendorStatus,
  VendorWorkOrder,
  VendorWorkOrderFilters,
} from "@/types/vendor";

function buildQuery(
  input: Record<
    string,
    string | undefined
  >,
) {
  const params =
    new URLSearchParams();

  for (
    const [
      key,
      value,
    ] of Object.entries(input)
  ) {
    if (value) {
      params.set(
        key,
        value,
      );
    }
  }

  const query =
    params.toString();

  return query
    ? `?${query}`
    : "";
}

export function useVendors() {
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

  const execute =
    useCallback(
      async <T,>(
        operation:
          () => Promise<T>,
      ): Promise<T> => {
        setLoading(true);
        setError(null);

        try {
          return await operation();
        } catch (caught) {
          const message =
            caught instanceof Error
              ? caught.message
              : "Vendor request failed";

          setError(message);

          throw caught;
        } finally {
          setLoading(false);
        }
      },
      [],
    );

  const list =
    useCallback(
      async (
        filters:
          VendorFilters = {},
      ) =>
        execute(async () => {
          const query =
            buildQuery({
              status:
                filters.status ||
                undefined,

              vendorType:
                filters.vendorType ||
                undefined,

              categoryId:
                filters.categoryId,

              propertyId:
                filters.propertyId,

              search:
                filters.search,
            });

          const response =
            await apiRequest<
              ApiSuccessResponse<
                Vendor[]
              >
            >(
              `/vendors${query}`,
            );

          return response.data;
        }),
      [execute],
    );

  const metrics =
    useCallback(
      async () =>
        execute(async () => {
          const response =
            await apiRequest<
              ApiSuccessResponse<
                VendorMetrics
              >
            >(
              "/vendors/metrics",
            );

          return response.data;
        }),
      [execute],
    );

  const categories =
    useCallback(
      async () =>
        execute(async () => {
          const response =
            await apiRequest<
              ApiSuccessResponse<
                VendorCategory[]
              >
            >(
              "/vendors/categories",
            );

          return response.data;
        }),
      [execute],
    );

  const get =
    useCallback(
      async (
        id: string,
      ) =>
        execute(async () => {
          const response =
            await apiRequest<
              ApiSuccessResponse<
                VendorDetails
              >
            >(
              `/vendors/${id}`,
            );

          return response.data;
        }),
      [execute],
    );

  const create =
    useCallback(
      async (
        input:
          CreateVendorInput,
      ) =>
        execute(async () => {
          const response =
            await apiRequest<
              ApiSuccessResponse<
                Vendor
              >
            >(
              "/vendors",
              {
                method: "POST",
                body:
                  JSON.stringify(
                    input,
                  ),
              },
            );

          return response.data;
        }),
      [execute],
    );

  const transition =
    useCallback(
      async (
        id: string,
        action:
          | "activate"
          | "suspend"
          | "block"
          | "reactivate"
          | "archive",
        changedByPersonId: string,
        remarks?: string,
      ) =>
        execute(async () => {
          const response =
            await apiRequest<
              ApiSuccessResponse<
                Vendor
              >
            >(
              `/vendors/${id}/${action}`,
              {
                method: "POST",
                body:
                  JSON.stringify({
                    changedByPersonId,
                    remarks:
                      remarks ||
                      undefined,
                  }),
              },
            );

          return response.data;
        }),
      [execute],
    );

  const ratingSummary =
    useCallback(
      async (
        id: string,
      ) =>
        execute(async () => {
          const response =
            await apiRequest<
              ApiSuccessResponse<
                VendorRatingSummary
              >
            >(
              `/vendors/${id}/rating-summary`,
            );

          return response.data;
        }),
      [execute],
    );

  const listByStatus =
    useCallback(
      async (
        status:
          VendorStatus,
      ) =>
        list({
          status,
        }),
      [list],
    );

  const listContracts =
    useCallback(
      async (
        filters:
          VendorContractFilters = {},
      ) =>
        execute(async () => {
          const query =
            buildQuery({
              vendorId:
                filters.vendorId,

              propertyId:
                filters.propertyId,

              status:
                filters.status ||
                undefined,

              search:
                filters.search,
            });

          const response =
            await apiRequest<
              ApiSuccessResponse<
                VendorContract[]
              >
            >(
              `/vendors/contracts${query}`,
            );

          return response.data;
        }),
      [execute],
    );

  const listWorkOrders =
    useCallback(
      async (
        filters:
          VendorWorkOrderFilters = {},
      ) =>
        execute(async () => {
          const query =
            buildQuery({
              vendorId:
                filters.vendorId,

              propertyId:
                filters.propertyId,

              contractId:
                filters.contractId,

              status:
                filters.status ||
                undefined,

              priority:
                filters.priority ||
                undefined,

              search:
                filters.search,
            });

          const response =
            await apiRequest<
              ApiSuccessResponse<
                VendorWorkOrder[]
              >
            >(
              `/vendors/work-orders${query}`,
            );

          return response.data;
        }),
      [execute],
    );

  return {
    loading,
    error,
    list,
    metrics,
    categories,
    get,
    create,
    transition,
    ratingSummary,
    listByStatus,
    listContracts,
    listWorkOrders,
  };
}
