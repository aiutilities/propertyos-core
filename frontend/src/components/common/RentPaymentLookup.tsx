"use client";

import { useEffect, useRef, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { RentPayment } from "@/types/payment";

type RentPaymentResponse = {
  success: boolean;
  data: RentPayment[];
};

type Props = {
  rentLedgerId: string;
  value: string;
  onChange: (rentPaymentId: string) => void;
  required?: boolean;
  disabled?: boolean;
};

export default function RentPaymentLookup({
  rentLedgerId,
  value,
  onChange,
  required = false,
  disabled = false,
}: Props) {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<RentPayment[]>([]);
  const [selected, setSelected] = useState<RentPayment | null>(null);
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
    const currentRequest = ++requestSequence.current;

    setSearch("");
    setItems([]);
    setSelected(null);
    setOpen(false);
    setError("");

    if (!rentLedgerId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    apiRequest<RentPaymentResponse>(
      `/rent-ledgers/${rentLedgerId}/payments`,
    )
      .then((response) => {
        if (currentRequest !== requestSequence.current) {
          return;
        }

        setItems(response.data);
      })
      .catch((err) => {
        if (currentRequest !== requestSequence.current) {
          return;
        }

        setItems([]);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load rent payments.",
        );
      })
      .finally(() => {
        if (currentRequest === requestSequence.current) {
          setLoading(false);
        }
      });
  }, [rentLedgerId]);

  const normalizedSearch = search.trim().toLowerCase();

  const filteredItems = normalizedSearch
    ? items.filter((payment) => {
        const searchable = [
          payment.paymentDate,
          payment.paymentMode,
          payment.referenceNumber ?? "",
          payment.notes ?? "",
          String(payment.amount),
        ]
          .join(" ")
          .toLowerCase();

        return searchable.includes(normalizedSearch);
      })
    : items;

  function choose(payment: RentPayment) {
    setSelected(payment);
    setSearch("");
    setOpen(false);
    onChange(payment.id);
  }

  function clear() {
    setSelected(null);
    setSearch("");
    onChange("");
  }

  const lookupDisabled = disabled || !rentLedgerId;

  return (
    <div className="entity-lookup">
      <input
        aria-label="Selected rent payment ID"
        readOnly
        required={required}
        tabIndex={-1}
        value={value}
        className="entity-lookup-hidden-value"
      />

      {selected ? (
        <div className="entity-lookup-selection">
          <div>
            <strong>
              ₹{selected.amount.toLocaleString("en-IN")}
            </strong>
            <span>
              {selected.paymentDate}
              {" · "}
              {selected.paymentMode}
              {selected.referenceNumber
                ? ` · ${selected.referenceNumber}`
                : ""}
            </span>
          </div>

          <button
            className="entity-lookup-clear"
            disabled={lookupDisabled}
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
            disabled={lookupDisabled}
            placeholder={
              rentLedgerId
                ? "Search payments by date, mode or reference"
                : "Select a rent ledger first"
            }
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
          />

          {open && rentLedgerId ? (
            <div className="entity-lookup-menu">
              {loading ? (
                <p className="entity-lookup-message">
                  Loading rent payments...
                </p>
              ) : null}

              {error ? (
                <p className="entity-lookup-message error-text">
                  {error}
                </p>
              ) : null}

              {!loading && !error && filteredItems.length === 0 ? (
                <p className="entity-lookup-message">
                  No rent payments found.
                </p>
              ) : null}

              {!loading && !error
                ? filteredItems.map((payment) => (
                    <button
                      className="entity-lookup-option"
                      key={payment.id}
                      type="button"
                      onClick={() => choose(payment)}
                    >
                      <strong>
                        ₹{payment.amount.toLocaleString("en-IN")}
                      </strong>
                      <span>
                        {payment.paymentDate}
                        {" · "}
                        {payment.paymentMode}
                        {payment.referenceNumber
                          ? ` · ${payment.referenceNumber}`
                          : ""}
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
