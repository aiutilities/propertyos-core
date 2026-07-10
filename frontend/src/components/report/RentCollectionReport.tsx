"use client";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import PaginationControls from "@/components/common/PaginationControls";
import { downloadApiFile } from "@/lib/api";
import PropertyLookup from "@/components/common/PropertyLookup";
import TenantLookup from "@/components/common/TenantLookup";
import { useRentCollectionReport } from "@/hooks/useRentCollectionReport";
import type { SortOrder } from "@/types/pagination";
import type { RentCollectionReportQuery } from "@/types/report";

const DEFAULT_LIMIT = 25;

const sortOptions = [
  { value: "paymentDate", label: "Payment Date" },
  { value: "amount", label: "Amount" },
  { value: "paymentMode", label: "Payment Mode" },
  { value: "tenantNumber", label: "Tenant Number" },
  { value: "tenantName", label: "Tenant Name" },
  { value: "propertyName", label: "Property Name" },
  { value: "agreementNumber", label: "Agreement Number" },
  { value: "receiptNumber", label: "Receipt Number" },
  { value: "createdAt", label: "Created Date" },
];

function positiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0
    ? parsed
    : fallback;
}

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

export default function RentCollectionReport() {
  const router = useRouter();
  const pathname = usePathname() ?? "/reports/rent-collection";
  const searchParams = useSearchParams();
  const searchParamsString = searchParams?.toString() ?? "";

  const query = useMemo<RentCollectionReportQuery>(() => {
    const params = new URLSearchParams(searchParamsString);

    return {
    page: positiveInteger(params.get("page"), 1),
    limit: positiveInteger(
      params.get("limit"),
      DEFAULT_LIMIT,
    ),
    search: params.get("search")?.trim() ?? "",
    sortBy: params.get("sortBy") ?? "paymentDate",
    sortOrder:
      params.get("sortOrder") === "asc"
        ? "asc"
        : "desc",
    propertyId: params.get("propertyId") ?? "",
    tenantId: params.get("tenantId") ?? "",
    paymentMode: params.get("paymentMode") ?? "",
    fromDate: params.get("fromDate") ?? "",
    toDate: params.get("toDate") ?? "",
    };
  }, [searchParamsString]);

  const [searchValue, setSearchValue] = useState(query.search);
  const [propertyId, setPropertyId] =
    useState(query.propertyId);
  const [tenantId, setTenantId] = useState(query.tenantId);
  const [paymentMode, setPaymentMode] =
    useState(query.paymentMode);
  const [fromDate, setFromDate] = useState(query.fromDate);
  const [toDate, setToDate] = useState(query.toDate);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  useEffect(() => {
    setSearchValue(query.search);
    setPropertyId(query.propertyId);
    setTenantId(query.tenantId);
    setPaymentMode(query.paymentMode);
    setFromDate(query.fromDate);
    setToDate(query.toDate);
  }, [
    query.search,
    query.propertyId,
    query.tenantId,
    query.paymentMode,
    query.fromDate,
    query.toDate,
  ]);

  const { data, loading, error } =
    useRentCollectionReport(query);

  function updateQuery(
    updates: Partial<RentCollectionReportQuery>,
  ) {
    const params = new URLSearchParams(searchParamsString);
    const next = { ...query, ...updates };

    params.set("page", String(next.page));
    params.set("limit", String(next.limit));
    params.set("sortBy", next.sortBy);
    params.set("sortOrder", next.sortOrder);

    const optionalValues: Array<
      [keyof RentCollectionReportQuery, string]
    > = [
      ["search", next.search],
      ["propertyId", next.propertyId],
      ["tenantId", next.tenantId],
      ["paymentMode", next.paymentMode],
      ["fromDate", next.fromDate],
      ["toDate", next.toDate],
    ];

    for (const [key, value] of optionalValues) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }

    router.replace(`${pathname}?${params.toString()}`, {
      scroll: false,
    });
  }

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    updateQuery({
      page: 1,
      search: searchValue.trim(),
      propertyId,
      tenantId,
      paymentMode,
      fromDate,
      toDate,
    });
  }

  async function exportCsv() {
    setExporting(true);
    setExportError("");

    try {
      const params = new URLSearchParams(searchParamsString);

      await downloadApiFile(
        `/reports/rent-collection/export.csv?${params.toString()}`,
        "rent-collection.csv",
      );
    } catch (err) {
      setExportError(
        err instanceof Error
          ? err.message
          : "Unable to export this report.",
      );
    } finally {
      setExporting(false);
    }
  }

  function resetFilters() {
    setSearchValue("");
    setPropertyId("");
    setTenantId("");
    setPaymentMode("");
    setFromDate("");
    setToDate("");

    router.replace(pathname, { scroll: false });
  }

  return (
    <div className="report-view">
      <div className="report-summary-grid">
        <article className="report-summary-card">
          <span>Total Collected</span>
          <strong>
            {formatAmount(data.summary.totalCollected)}
          </strong>
          <small>Across the current report filters</small>
        </article>

        <article className="report-summary-card">
          <span>Payment Count</span>
          <strong>{data.summary.paymentCount}</strong>
          <small>Matching payment records</small>
        </article>
      </div>

      <form
        className="report-filter-panel"
        onSubmit={applyFilters}
      >
        <div className="report-search-row">
          <label className="report-field report-search-field">
            Search
            <input
              placeholder="Tenant, property, agreement, receipt or reference"
              type="search"
              value={searchValue}
              onChange={(event) =>
                setSearchValue(event.target.value)
              }
            />
          </label>

          <label className="report-field">
            Payment Mode
            <select
              value={paymentMode}
              onChange={(event) =>
                setPaymentMode(event.target.value)
              }
            >
              <option value="">All modes</option>
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="BANK_TRANSFER">
                Bank Transfer
              </option>
              <option value="CHEQUE">Cheque</option>
              <option value="CARD">Card</option>
            </select>
          </label>
        </div>

        <div className="report-filter-grid">
          <label className="report-field">
            Property
            <PropertyLookup
              value={propertyId}
              onChange={setPropertyId}
            />
          </label>

          <label className="report-field">
            Tenant
            <TenantLookup
              value={tenantId}
              onChange={setTenantId}
            />
          </label>

          <label className="report-field">
            From Date
            <input
              type="date"
              value={fromDate}
              onChange={(event) =>
                setFromDate(event.target.value)
              }
            />
          </label>

          <label className="report-field">
            To Date
            <input
              type="date"
              value={toDate}
              onChange={(event) =>
                setToDate(event.target.value)
              }
            />
          </label>
        </div>

        <div className="report-filter-actions">
          <button type="submit">Apply Filters</button>
          <button
            className="secondary-button"
            type="button"
            onClick={resetFilters}
          >
            Reset
          </button>
        </div>
      </form>

      {exportError ? (
        <p className="error">{exportError}</p>
      ) : null}

      <div className="report-actions-row">
        <button
          className="button-link"
          disabled={exporting}
          type="button"
          onClick={exportCsv}
        >
          {exporting ? "Exporting..." : "Export CSV"}
        </button>
      </div>

      <div className="report-list-controls">
        <label>
          Rows
          <select
            value={query.limit}
            onChange={(event) =>
              updateQuery({
                limit: Number(event.target.value),
                page: 1,
              })
            }
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </label>

        <label>
          Sort
          <select
            value={query.sortBy}
            onChange={(event) =>
              updateQuery({
                sortBy: event.target.value,
                page: 1,
              })
            }
          >
            {sortOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Order
          <select
            value={query.sortOrder}
            onChange={(event) =>
              updateQuery({
                sortOrder:
                  event.target.value as SortOrder,
                page: 1,
              })
            }
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </label>
      </div>

      {loading ? <p>Loading rent collections...</p> : null}
      {error ? <p className="error">{error}</p> : null}

      {!loading && !error && data.items.length === 0 ? (
        <div className="empty-state">
          <h2>No rent collections found</h2>
          <p>
            Try changing the report filters or record a tenant
            payment before running this report.
          </p>
        </div>
      ) : null}

      {!loading && !error && data.items.length > 0 ? (
        <>
          <table className="table report-table">
            <thead>
              <tr>
                <th>Payment Date</th>
                <th>Receipt</th>
                <th>Property</th>
                <th>Tenant</th>
                <th>Agreement</th>
                <th>Ledger</th>
                <th>Amount</th>
                <th>Mode</th>
                <th>Reference</th>
              </tr>
            </thead>

            <tbody>
              {data.items.map((item) => (
                <tr key={item.paymentId}>
                  <td>{item.paymentDate}</td>
                  <td>
                    {item.receiptId ? (
                      <Link
                        href={`/receipts/${item.receiptId}`}
                      >
                        {item.receiptNumber ??
                          item.receiptId}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <Link
                      href={`/properties/${item.propertyId}`}
                    >
                      {item.propertyName}
                    </Link>
                  </td>
                  <td>
                    <Link href={`/tenants/${item.tenantId}`}>
                      <strong>{item.tenantName}</strong>
                      <span className="report-cell-detail">
                        {item.tenantNumber}
                      </span>
                    </Link>
                  </td>
                  <td>
                    <Link href={`/leases/${item.agreementId}`}>
                      {item.agreementNumber}
                    </Link>
                  </td>
                  <td>
                    <Link
                      href={`/rent-ledgers/${item.rentLedgerId}`}
                    >
                      View ledger
                    </Link>
                  </td>
                  <td>{formatAmount(item.amount)}</td>
                  <td>{item.paymentMode}</td>
                  <td>{item.referenceNumber ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <PaginationControls
            page={data.page}
            limit={data.limit}
            total={data.total}
            totalPages={data.totalPages}
            onPageChange={(page) =>
              updateQuery({ page })
            }
          />
        </>
      ) : null}
    </div>
  );
}
