"use client";

import Link from "next/link";
import ListToolbar from "@/components/common/ListToolbar";
import PaginationControls from "@/components/common/PaginationControls";
import { useListQuery } from "@/hooks/useListQuery";
import { useRentLedgers } from "@/hooks/useRentLedgers";
import type { SortOrder } from "@/types/pagination";

const sortOptions = [
  { value: "createdAt", label: "Newest" },
  { value: "periodYear", label: "Period Year" },
  { value: "periodMonth", label: "Period Month" },
  { value: "dueDate", label: "Due Date" },
  { value: "rentAmount", label: "Rent Amount" },
  { value: "amountPaid", label: "Amount Paid" },
  { value: "balanceAmount", label: "Balance" },
  { value: "status", label: "Status" },
  { value: "updatedAt", label: "Recently Updated" },
];

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

export default function RentLedgerTable() {
  const {
    query,
    setSearch,
    setPage,
    setLimit,
    setSort,
    reset,
  } = useListQuery("createdAt");

  const { ledgers, pagination, loading, error } =
    useRentLedgers(query);

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
        placeholder="Search rent ledgers by status"
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

      {loading ? <p>Loading rent ledgers...</p> : null}
      {error ? <p className="error">{error}</p> : null}

      {!loading && !error && ledgers.length === 0 ? (
        <div className="empty-state">
          <h2>No rent ledgers found</h2>
          <p>
            {query.search
              ? "Try another status or clear the current search."
              : "Rent ledgers will appear here after they are created for active agreements."}
          </p>
        </div>
      ) : null}

      {!loading && !error && ledgers.length > 0 ? (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Tenant</th>
                <th>Agreement</th>
                <th>Rent</th>
                <th>Paid</th>
                <th>Balance</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {ledgers.map((ledger) => (
                <tr key={ledger.id}>
                  <td>
                    <Link href={`/rent-ledgers/${ledger.id}`}>
                      {ledger.periodMonth}/{ledger.periodYear}
                    </Link>
                  </td>
                  <td>
                    <Link href={`/tenants/${ledger.tenantId}`}>
                      {ledger.tenantId}
                    </Link>
                  </td>
                  <td>
                    <Link href={`/leases/${ledger.agreementId}`}>
                      {ledger.agreementId}
                    </Link>
                  </td>
                  <td>{formatAmount(ledger.rentAmount)}</td>
                  <td>{formatAmount(ledger.amountPaid)}</td>
                  <td>{formatAmount(ledger.balanceAmount)}</td>
                  <td>{ledger.status}</td>
                </tr>
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
