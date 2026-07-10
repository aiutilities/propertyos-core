"use client";

import { useEffect, useState } from "react";

import { apiRequest } from "@/lib/api";
import type {
  RentCollectionReportData,
  RentCollectionReportQuery,
  RentCollectionReportResponse,
} from "@/types/report";

const emptyData: RentCollectionReportData = {
  items: [],
  page: 1,
  limit: 25,
  total: 0,
  totalPages: 0,
  summary: {
    totalCollected: 0,
    paymentCount: 0,
  },
};

export function useRentCollectionReport(
  query: RentCollectionReportQuery,
) {
  const [data, setData] =
    useState<RentCollectionReportData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          page: String(query.page),
          limit: String(query.limit),
          sortBy: query.sortBy,
          sortOrder: query.sortOrder,
        });

        if (query.search) {
          params.set("search", query.search);
        }

        if (query.propertyId) {
          params.set("propertyId", query.propertyId);
        }

        if (query.tenantId) {
          params.set("tenantId", query.tenantId);
        }

        if (query.paymentMode) {
          params.set("paymentMode", query.paymentMode);
        }

        if (query.fromDate) {
          params.set("fromDate", query.fromDate);
        }

        if (query.toDate) {
          params.set("toDate", query.toDate);
        }

        const response =
          await apiRequest<RentCollectionReportResponse>(
            `/reports/rent-collection?${params.toString()}`,
          );

        if (!active) return;

        setData(response.data);
      } catch (err) {
        if (!active) return;

        setData(emptyData);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load the rent collection report.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [
    query.page,
    query.limit,
    query.search,
    query.sortBy,
    query.sortOrder,
    query.propertyId,
    query.tenantId,
    query.paymentMode,
    query.fromDate,
    query.toDate,
  ]);

  return { data, loading, error };
}
