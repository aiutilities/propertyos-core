"use client";

import ListToolbar from "@/components/common/ListToolbar";
import PaginationControls from "@/components/common/PaginationControls";
import { useInvoices } from "@/hooks/useInvoices";
import { useListQuery } from "@/hooks/useListQuery";
import type { SortOrder } from "@/types/pagination";
import InvoiceRow from "./InvoiceRow";

const sortOptions = [
  { value: "createdAt", label: "Newest" },
  { value: "invoiceNumber", label: "Invoice Number" },
  { value: "invoiceDate", label: "Invoice Date" },
  { value: "dueDate", label: "Due Date" },
  { value: "amount", label: "Amount" },
  { value: "status", label: "Status" },
  { value: "updatedAt", label: "Recently Updated" },
];

export default function InvoiceTable() {
  const {
    query,
    setSearch,
    setPage,
    setLimit,
    setSort,
    reset,
  } = useListQuery("createdAt");

  const { invoices, pagination, loading, error } =
    useInvoices(query);

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
        placeholder="Search invoices by number or status"
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

      {loading ? <p>Loading invoices...</p> : null}
      {error ? <p className="error">{error}</p> : null}

      {!loading && !error && invoices.length === 0 ? (
        <div className="empty-state">
          <h2>No invoices found</h2>
          <p>
            {query.search
              ? "Try another invoice number or status, or clear the current search."
              : "Create your first invoice to begin tracking tenant billing."}
          </p>
        </div>
      ) : null}

      {!loading && !error && invoices.length > 0 ? (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Tenant</th>
                <th>Period</th>
                <th>Due Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {invoices.map((invoice) => (
                <InvoiceRow key={invoice.id} invoice={invoice} />
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
