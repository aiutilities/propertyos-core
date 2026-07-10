"use client";

import { useEffect, useRef, useState } from "react";
import { apiRequest } from "@/lib/api";
import type {
  RentLedger,
  RentLedgerListResponse,
} from "@/types/rent";

type Props = {
  value?: string;
  onChange: (rentLedgerId: string) => void;
  required?: boolean;
  disabled?: boolean;
};

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPeriod(ledger: RentLedger) {
  const month =
    monthNames[ledger.periodMonth - 1] ??
    String(ledger.periodMonth);

  return `${month} ${ledger.periodYear}`;
}

export default function RentLedgerLookup({
  value = "",
  onChange,
  required = false,
  disabled = false,
}: Props) {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<RentLedger[]>([]);
  const [selected, setSelected] =
    useState<RentLedger | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const requestSequence = useRef(0);

  useEffect(() => {
    if (!value) {
      setSelected(null);
    }
  }, [value]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const currentRequest = ++requestSequence.current;

    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          page: "1",
          limit: "10",
          sortBy: "createdAt",
          sortOrder: "desc",
        });

        if (search.trim()) {
          params.set("search", search.trim());
        }

        const response =
          await apiRequest<RentLedgerListResponse>(
            `/rent-ledgers?${params.toString()}`,
          );

        if (currentRequest !== requestSequence.current) {
          return;
        }

        setItems(response.data.items);
      } catch (err) {
        if (currentRequest !== requestSequence.current) {
          return;
        }

        setItems([]);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load rent ledgers.",
        );
      } finally {
        if (currentRequest === requestSequence.current) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [open, search]);

  function choose(ledger: RentLedger) {
    setSelected(ledger);
    setSearch("");
    setOpen(false);
    onChange(ledger.id);
  }

  function clear() {
    setSelected(null);
    setSearch("");
    setItems([]);
    onChange("");
  }

  return (
    <div className="entity-lookup">
      <input
        aria-label="Selected rent ledger ID"
        className="entity-lookup-hidden-value"
        readOnly
        required={required}
        tabIndex={-1}
        value={value}
      />

      {selected ? (
        <div className="entity-lookup-selection">
          <div>
            <strong>{formatPeriod(selected)}</strong>
            <span>
              {selected.status} · Balance{" "}
              {formatAmount(selected.balanceAmount)}
            </span>
          </div>

          <button
            className="entity-lookup-clear"
            disabled={disabled}
            type="button"
            onClick={clear}
          >
            Change
          </button>
        </div>
      ) : (
        <div className="entity-lookup-input-wrap">
          <input
            autoComplete="off"
            disabled={disabled}
            placeholder="Search by ledger status"
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
          />

          {open ? (
            <div className="entity-lookup-menu">
              {loading ? (
                <p className="entity-lookup-message">
                  Loading rent ledgers...
                </p>
              ) : null}

              {error ? (
                <p className="entity-lookup-message error-text">
                  {error}
                </p>
              ) : null}

              {!loading && !error && items.length === 0 ? (
                <p className="entity-lookup-message">
                  No rent ledgers found.
                </p>
              ) : null}

              {!loading && !error
                ? items.map((ledger) => (
                    <button
                      className="entity-lookup-option"
                      key={ledger.id}
                      type="button"
                      onClick={() => choose(ledger)}
                    >
                      <strong>{formatPeriod(ledger)}</strong>
                      <span>
                        {ledger.status} · Rent{" "}
                        {formatAmount(ledger.rentAmount)} ·
                        Balance{" "}
                        {formatAmount(ledger.balanceAmount)}
                      </span>
                      <span>
                        Tenant {ledger.tenantId} · Agreement{" "}
                        {ledger.agreementId}
                      </span>
                    </button>
                  ))
                : null}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
