"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { RentLedger, RentLedgerListResponse } from "@/types/rent";
import type { ListQuery, PaginationMeta } from "@/types/pagination";

const emptyPagination: PaginationMeta = {
  page: 1,
  limit: 25,
  total: 0,
  totalPages: 0,
};

export function useRentLedgers(query: ListQuery) {
  const [ledgers, setLedgers] = useState<RentLedger[]>([]);
  const [pagination, setPagination] =
    useState<PaginationMeta>(emptyPagination);
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

        const response = await apiRequest<RentLedgerListResponse>(
          `/rent-ledgers?${params.toString()}`,
        );

        if (!active) return;

        setLedgers(response.data.items);
        setPagination({
          page: response.data.page,
          limit: response.data.limit,
          total: response.data.total,
          totalPages: response.data.totalPages,
        });
      } catch (err) {
        if (!active) return;

        setLedgers([]);
        setPagination(emptyPagination);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load rent ledgers.",
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
  ]);

  return { ledgers, pagination, loading, error };
}
