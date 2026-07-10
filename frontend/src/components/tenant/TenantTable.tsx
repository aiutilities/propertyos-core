"use client";

import ListToolbar from "@/components/common/ListToolbar";
import PaginationControls from "@/components/common/PaginationControls";
import { useListQuery } from "@/hooks/useListQuery";
import { useTenants } from "@/hooks/useTenants";
import type { SortOrder } from "@/types/pagination";
import TenantRow from "./TenantRow";

const sortOptions = [
  { value: "createdAt", label: "Newest" },
  { value: "tenantNumber", label: "Tenant Number" },
  { value: "status", label: "Status" },
  { value: "moveInDate", label: "Move-in Date" },
  { value: "moveOutDate", label: "Move-out Date" },
];

export default function TenantTable() {
  const {
    query,
    setSearch,
    setPage,
    setLimit,
    setSort,
    reset,
  } = useListQuery("createdAt");

  const { tenants, pagination, loading, error } = useTenants(query);

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
        placeholder="Search by tenant number or status"
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

      {loading ? <p>Loading tenants...</p> : null}
      {error ? <p className="error">{error}</p> : null}

      {!loading && !error && tenants.length === 0 ? (
        <div className="empty-state">
          <h2>No tenants found</h2>
          <p>
            {query.search
              ? "Try another tenant number or status, or clear the current search."
              : "Create your first tenant to begin managing leases and spaces."}
          </p>
        </div>
      ) : null}

      {!loading && !error && tenants.length > 0 ? (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>Tenant Number</th>
                <th>Status</th>
                <th>Property ID</th>
                <th>Move In</th>
                <th>Move Out</th>
              </tr>
            </thead>

            <tbody>
              {tenants.map((tenant) => (
                <TenantRow key={tenant.id} tenant={tenant} />
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
