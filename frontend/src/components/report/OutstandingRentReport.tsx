"use client";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

import PaginationControls from "@/components/common/PaginationControls";
import { downloadApiFile } from "@/lib/api";
import PropertyLookup from "@/components/common/PropertyLookup";
import TenantLookup from "@/components/common/TenantLookup";
import { useOutstandingRentReport } from "@/hooks/useOutstandingRentReport";
import type { SortOrder } from "@/types/pagination";
import type { OutstandingRentReportQuery } from "@/types/report";

const DEFAULT_LIMIT = 25;

const sortOptions = [
  { value: "dueDate", label: "Due Date" },
  { value: "balanceAmount", label: "Outstanding Balance" },
  { value: "rentAmount", label: "Rent Amount" },
  { value: "amountPaid", label: "Amount Paid" },
  { value: "overdueDays", label: "Overdue Days" },
  { value: "tenantNumber", label: "Tenant Number" },
  { value: "tenantName", label: "Tenant Name" },
  { value: "propertyName", label: "Property Name" },
  { value: "agreementNumber", label: "Agreement Number" },
  { value: "periodYear", label: "Period Year" },
  { value: "periodMonth", label: "Period Month" },
  { value: "status", label: "Status" },
  { value: "createdAt", label: "Created Date" },
];

function positiveInteger(
  value: string | null,
  fallback: number,
) {
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

function formatPeriod(month: number, year: number) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

export default function OutstandingRentReport() {
  const router = useRouter();
  const pathname =
    usePathname() ?? "/reports/outstanding-rent";
  const searchParams = useSearchParams();
  const searchParamsString =
    searchParams?.toString() ?? "";

  const query =
    useMemo<OutstandingRentReportQuery>(() => {
      const params =
        new URLSearchParams(searchParamsString);

      return {
        page: positiveInteger(params.get("page"), 1),
        limit: positiveInteger(
          params.get("limit"),
          DEFAULT_LIMIT,
        ),
        search: params.get("search")?.trim() ?? "",
        sortBy: params.get("sortBy") ?? "dueDate",
        sortOrder:
          params.get("sortOrder") === "asc"
            ? "asc"
            : "desc",
        propertyId: params.get("propertyId") ?? "",
        tenantId: params.get("tenantId") ?? "",
        status: params.get("status") ?? "",
        dueFrom: params.get("dueFrom") ?? "",
        dueTo: params.get("dueTo") ?? "",
      };
    }, [searchParamsString]);

  const [searchValue, setSearchValue] =
    useState(query.search);
  const [propertyId, setPropertyId] =
    useState(query.propertyId);
  const [tenantId, setTenantId] =
    useState(query.tenantId);
  const [status, setStatus] =
    useState(query.status);
  const [dueFrom, setDueFrom] =
    useState(query.dueFrom);
  const [dueTo, setDueTo] =
    useState(query.dueTo);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  useEffect(() => {
    setSearchValue(query.search);
    setPropertyId(query.propertyId);
    setTenantId(query.tenantId);
    setStatus(query.status);
    setDueFrom(query.dueFrom);
    setDueTo(query.dueTo);
  }, [
    query.search,
    query.propertyId,
    query.tenantId,
    query.status,
    query.dueFrom,
    query.dueTo,
  ]);

  const { data, loading, error } =
    useOutstandingRentReport(query);

  function updateQuery(
    updates: Partial<OutstandingRentReportQuery>,
  ) {
    const params =
      new URLSearchParams(searchParamsString);
    const next = { ...query, ...updates };

    params.set("page", String(next.page));
    params.set("limit", String(next.limit));
    params.set("sortBy", next.sortBy);
    params.set("sortOrder", next.sortOrder);

    const optionalValues: Array<
      [keyof OutstandingRentReportQuery, string]
    > = [
      ["search", next.search],
      ["propertyId", next.propertyId],
      ["tenantId", next.tenantId],
      ["status", next.status],
      ["dueFrom", next.dueFrom],
      ["dueTo", next.dueTo],
    ];

    for (const [key, value] of optionalValues) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }

    router.replace(
      `${pathname}?${params.toString()}`,
      { scroll: false },
    );
  }

  function applyFilters(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    updateQuery({
      page: 1,
      search: searchValue.trim(),
      propertyId,
      tenantId,
      status,
      dueFrom,
      dueTo,
    });
  }

  async function exportCsv() {
    setExporting(true);
    setExportError("");

    try {
      const params = new URLSearchParams(searchParamsString);

      await downloadApiFile(
        `/reports/outstanding-rent/export.csv?${params.toString()}`,
        "outstanding-rent.csv",
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
    setStatus("");
    setDueFrom("");
    setDueTo("");

    router.replace(pathname, { scroll: false });
  }

  return (
    <div className="report-view">
      <div className="report-summary-grid report-summary-grid-wide">
        <article className="report-summary-card">
          <span>Total Rent Billed</span>
          <strong>
            {formatAmount(
              data.summary.totalRentBilled,
            )}
          </strong>
          <small>Rent represented by matching ledgers</small>
        </article>

        <article className="report-summary-card">
          <span>Total Paid</span>
          <strong>
            {formatAmount(
              data.summary.totalAmountPaid,
            )}
          </strong>
          <small>Payments received against these ledgers</small>
        </article>

        <article className="report-summary-card report-summary-card-emphasis">
          <span>Total Outstanding</span>
          <strong>
            {formatAmount(
              data.summary.totalOutstanding,
            )}
          </strong>
          <small>Current unpaid balance</small>
        </article>

        <article className="report-summary-card">
          <span>Outstanding Ledgers</span>
          <strong>{data.summary.ledgerCount}</strong>
          <small>Ledgers with a positive balance</small>
        </article>

        <article className="report-summary-card">
          <span>Overdue Ledgers</span>
          <strong>
            {data.summary.overdueLedgerCount}
          </strong>
          <small>Outstanding after the due date</small>
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
              placeholder="Tenant, property, agreement, status or period"
              type="search"
              value={searchValue}
              onChange={(event) =>
                setSearchValue(event.target.value)
              }
            />
          </label>

          <label className="report-field">
            Ledger Status
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value)
              }
            >
              <option value="">All statuses</option>
              <option value="UNPAID">Unpaid</option>
              <option value="PARTIAL">
                Partially Paid
              </option>
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
            Due From
            <input
              type="date"
              value={dueFrom}
              onChange={(event) =>
                setDueFrom(event.target.value)
              }
            />
          </label>

          <label className="report-field">
            Due To
            <input
              type="date"
              value={dueTo}
              onChange={(event) =>
                setDueTo(event.target.value)
              }
            />
          </label>
        </div>

        <div className="report-filter-actions">
          <button type="submit">
            Apply Filters
          </button>

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

      {loading ? (
        <p>Loading outstanding rent...</p>
      ) : null}

      {error ? (
        <p className="error">{error}</p>
      ) : null}

      {!loading &&
      !error &&
      data.items.length === 0 ? (
        <div className="empty-state">
          <h2>No outstanding rent found</h2>
          <p>
            No rent ledgers with a positive balance
            match the current filters.
          </p>
        </div>
      ) : null}

      {!loading &&
      !error &&
      data.items.length > 0 ? (
        <>
          <table className="table report-table">
            <thead>
              <tr>
                <th>Due Date</th>
                <th>Period</th>
                <th>Property</th>
                <th>Tenant</th>
                <th>Agreement</th>
                <th>Rent</th>
                <th>Paid</th>
                <th>Outstanding</th>
                <th>Status</th>
                <th>Overdue</th>
              </tr>
            </thead>

            <tbody>
              {data.items.map((item) => (
                <tr key={item.rentLedgerId}>
                  <td>
                    <Link
                      href={`/rent-ledgers/${item.rentLedgerId}`}
                    >
                      {item.dueDate}
                    </Link>
                  </td>

                  <td>
                    {formatPeriod(
                      item.periodMonth,
                      item.periodYear,
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
                    <Link
                      href={`/tenants/${item.tenantId}`}
                    >
                      <strong>
                        {item.tenantName}
                      </strong>
                      <span className="report-cell-detail">
                        {item.tenantNumber}
                      </span>
                    </Link>
                  </td>

                  <td>
                    <Link
                      href={`/leases/${item.agreementId}`}
                    >
                      {item.agreementNumber}
                    </Link>
                  </td>

                  <td>
                    {formatAmount(item.rentAmount)}
                  </td>

                  <td>
                    {formatAmount(item.amountPaid)}
                  </td>

                  <td>
                    <strong className="outstanding-amount">
                      {formatAmount(
                        item.balanceAmount,
                      )}
                    </strong>
                  </td>

                  <td>
                    <span
                      className={
                        item.status === "UNPAID"
                          ? "report-status-pill report-status-unpaid"
                          : "report-status-pill report-status-partial"
                      }
                    >
                      {item.status === "PARTIAL"
                        ? "Partial"
                        : "Unpaid"}
                    </span>
                  </td>

                  <td>
                    {item.overdueDays > 0
                      ? `${item.overdueDays} days`
                      : "Not overdue"}
                  </td>
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
