"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ListQuery, SortOrder } from "@/types/pagination";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 25;

function positiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0
    ? parsed
    : fallback;
}

export function useListQuery(defaultSortBy = "createdAt") {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();

  const query: ListQuery = {
    page: positiveInteger(searchParams?.get("page") ?? null, DEFAULT_PAGE),
    limit: positiveInteger(searchParams?.get("limit") ?? null, DEFAULT_LIMIT),
    search: searchParams?.get("search")?.trim() ?? "",
    sortBy: searchParams?.get("sortBy") ?? defaultSortBy,
    sortOrder:
      searchParams?.get("sortOrder") === "asc" ? "asc" : "desc",
  };

  function update(updates: Partial<ListQuery>) {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    const next = { ...query, ...updates };

    params.set("page", String(next.page));
    params.set("limit", String(next.limit));

    if (next.search) {
      params.set("search", next.search);
    } else {
      params.delete("search");
    }

    if (next.sortBy) {
      params.set("sortBy", next.sortBy);
      params.set("sortOrder", next.sortOrder);
    } else {
      params.delete("sortBy");
      params.delete("sortOrder");
    }

    router.replace(`${pathname}?${params.toString()}`, {
      scroll: false,
    });
  }

  function setSearch(search: string) {
    update({ search: search.trim(), page: 1 });
  }

  function setPage(page: number) {
    update({ page: Math.max(page, 1) });
  }

  function setLimit(limit: number) {
    update({ limit, page: 1 });
  }

  function setSort(sortBy: string, sortOrder: SortOrder) {
    update({ sortBy, sortOrder, page: 1 });
  }

  function reset() {
    router.replace(pathname, { scroll: false });
  }

  return {
    query,
    setSearch,
    setPage,
    setLimit,
    setSort,
    reset,
  };
}
