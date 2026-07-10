"use client";

import { useEffect, useState } from "react";

import { apiRequest } from "@/lib/api";
import type {
  OutstandingRentReportData,
  OutstandingRentReportQuery,
  OutstandingRentReportResponse,
} from "@/types/report";

const emptyData: OutstandingRentReportData = {
  items: [],
  page: 1,
  limit: 25,
  total: 0,
  totalPages: 0,
  summary: {
    totalRentBilled: 0,
    totalAmountPaid: 0,
    totalOutstanding: 0,
    ledgerCount: 0,
    overdueLedgerCount: 0,
  },
};

export function useOutstandingRentReport(
  query: OutstandingRentReportQuery,
) {
  const [data, setData] =
    useState<OutstandingRentReportData>(emptyData);
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

        if (query.status) {
          params.set("status", query.status);
        }

        if (query.dueFrom) {
          params.set("dueFrom", query.dueFrom);
        }

        if (query.dueTo) {
          params.set("dueTo", query.dueTo);
        }

        const response =
          await apiRequest<OutstandingRentReportResponse>(
            `/reports/outstanding-rent?${params.toString()}`,
          );

        if (!active) return;

        setData(response.data);
      } catch (err) {
        if (!active) return;

        setData(emptyData);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load the outstanding rent report.",
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
    query.status,
    query.dueFrom,
    query.dueTo,
  ]);

  return { data, loading, error };
}
