"use client";

import ListToolbar from "@/components/common/ListToolbar";
import PaginationControls from "@/components/common/PaginationControls";
import { useListQuery } from "@/hooks/useListQuery";
import { useReceipts } from "@/hooks/useReceipts";
import type { SortOrder } from "@/types/pagination";
import ReceiptRow from "./ReceiptRow";

const sortOptions = [
  { value: "createdAt", label: "Newest" },
  { value: "receiptNumber", label: "Receipt Number" },
  { value: "receiptDate", label: "Receipt Date" },
  { value: "amount", label: "Amount" },
  { value: "paymentMode", label: "Payment Mode" },
  { value: "status", label: "Status" },
  { value: "updatedAt", label: "Recently Updated" },
];

export default function ReceiptTable() {
  const {
    query,
    setSearch,
    setPage,
    setLimit,
    setSort,
    reset,
  } = useListQuery("createdAt");

  const { receipts, pagination, loading, error } =
    useReceipts(query);

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
        placeholder="Search by receipt number, mode, reference or status"
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

      {loading ? <p>Loading receipts...</p> : null}
      {error ? <p className="error">{error}</p> : null}

      {!loading && !error && receipts.length === 0 ? (
        <div className="empty-state">
          <h2>No receipts found</h2>
          <p>
            {query.search
              ? "Try another receipt number, payment mode or status."
              : "Receipts will appear here after tenant payments are recorded."}
          </p>
        </div>
      ) : null}

      {!loading && !error && receipts.length > 0 ? (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>Receipt</th>
                <th>Tenant</th>
                <th>Ledger</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Mode</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {receipts.map((receipt) => (
                <ReceiptRow key={receipt.id} receipt={receipt} />
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
