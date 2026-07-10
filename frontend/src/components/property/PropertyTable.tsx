"use client";

import ListToolbar from "@/components/common/ListToolbar";
import PaginationControls from "@/components/common/PaginationControls";
import { useListQuery } from "@/hooks/useListQuery";
import { useProperties } from "@/hooks/useProperties";
import type { SortOrder } from "@/types/pagination";
import PropertyRow from "./PropertyRow";

const sortOptions = [
  { value: "createdAt", label: "Newest" },
  { value: "name", label: "Name" },
  { value: "code", label: "Code" },
  { value: "propertyType", label: "Type" },
  { value: "city", label: "City" },
  { value: "state", label: "State" },
];

export default function PropertyTable() {
  const {
    query,
    setSearch,
    setPage,
    setLimit,
    setSort,
    reset,
  } = useListQuery("createdAt");

  const { items, pagination, loading, error } = useProperties(query);

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
        placeholder="Search properties by name, code, type or location"
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

      {loading ? <p>Loading properties...</p> : null}
      {error ? <p className="error">{error}</p> : null}

      {!loading && !error && items.length === 0 ? (
        <div className="empty-state">
          <h2>No properties found</h2>
          <p>
            {query.search
              ? "Try another search term or clear the current filters."
              : "Create your first property to begin managing spaces and tenants."}
          </p>
        </div>
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th>Type</th>
                <th>City</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {items.map((property) => (
                <PropertyRow key={property.id} property={property} />
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
