"use client";

import ListToolbar from "@/components/common/ListToolbar";
import PaginationControls from "@/components/common/PaginationControls";
import { useListQuery } from "@/hooks/useListQuery";
import { useLeases } from "@/hooks/useLeases";
import type { SortOrder } from "@/types/pagination";
import LeaseRow from "./LeaseRow";

const sortOptions = [
  { value: "createdAt", label: "Newest" },
  { value: "agreementNumber", label: "Agreement Number" },
  { value: "status", label: "Status" },
  { value: "updatedAt", label: "Recently Updated" },
];

export default function LeaseTable() {
  const {
    query,
    setSearch,
    setPage,
    setLimit,
    setSort,
    reset,
  } = useListQuery("createdAt");

  const { leases, pagination, loading, error } = useLeases(query);

  function updateSortBy(sortBy: string) {
    setSort(sortBy, query.sortOrder);
  }

  function updateSortOrder(sortOrder: string) {
    setSort(query.sortBy, sortOrder as SortOrder);
  }

  return (
    <div className="list-view">
      <ListToolbar
        limit={query.limit}
        placeholder="Search by agreement number or status"
        search={query.search}
        onLimitChange={setLimit}
        onReset={reset}
        onSearch={setSearch}
        actions={
          <div className="sort-controls">
            <label>
              Sort
              <select
                value={query.sortBy}
                onChange={(event) => updateSortBy(event.target.value)}
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Order
              <select
                value={query.sortOrder}
                onChange={(event) => updateSortOrder(event.target.value)}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </label>
          </div>
        }
      />

      {loading ? <p>Loading leases...</p> : null}
      {error ? <p className="error">{error}</p> : null}

      {!loading && !error && leases.length === 0 ? (
        <div className="empty-state">
          <h2>No leases found</h2>
          <p>
            {query.search
              ? "Try another agreement number or status, or clear the current search."
              : "Create your first lease to begin tracking agreement versions and rent."}
          </p>
        </div>
      ) : null}

      {!loading && !error && leases.length > 0 ? (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>Lease / Agreement</th>
                <th>Tenant</th>
                <th>Current Version</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>

            <tbody>
              {leases.map((lease) => (
                <LeaseRow key={lease.id} lease={lease} />
              ))}
            </tbody>
          </table>

          <PaginationControls
            limit={pagination.limit}
            page={pagination.page}
            total={pagination.total}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
          />
        </>
      ) : null}
    </div>
  );
}
