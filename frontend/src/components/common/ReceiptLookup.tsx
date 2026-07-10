"use client";

import { useEffect, useRef, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { Receipt, ReceiptListResponse } from "@/types/receipt";

type Props = {
  value: string;
  onChange: (receiptId: string) => void;
  required?: boolean;
  disabled?: boolean;
};

export default function ReceiptLookup({
  value,
  onChange,
  required = false,
  disabled = false,
}: Props) {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<Receipt[]>([]);
  const [selected, setSelected] = useState<Receipt | null>(null);
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

    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          page: "1",
          limit: "10",
          sortBy: "receiptDate",
          sortOrder: "desc",
        });

        if (search.trim()) {
          params.set("search", search.trim());
        }

        const response = await apiRequest<ReceiptListResponse>(
          `/receipts?${params.toString()}`,
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
            : "Unable to load receipts.",
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
  }, [search]);

  function choose(receipt: Receipt) {
    setSelected(receipt);
    setSearch("");
    setOpen(false);
    onChange(receipt.id);
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
        aria-label="Selected receipt ID"
        readOnly
        required={required}
        tabIndex={-1}
        value={value}
        className="entity-lookup-hidden-value"
      />

      {selected ? (
        <div className="entity-lookup-selection">
          <div>
            <strong>{selected.receiptNumber}</strong>
            <span>
              ₹{selected.amount.toLocaleString("en-IN")}
              {" · "}
              {selected.receiptDate}
              {" · "}
              {selected.paymentMode}
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
            placeholder="Search by receipt number, mode or reference"
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
                  Loading receipts...
                </p>
              ) : null}

              {error ? (
                <p className="entity-lookup-message error-text">
                  {error}
                </p>
              ) : null}

              {!loading && !error && items.length === 0 ? (
                <p className="entity-lookup-message">
                  No receipts found.
                </p>
              ) : null}

              {!loading && !error
                ? items.map((receipt) => (
                    <button
                      className="entity-lookup-option"
                      key={receipt.id}
                      type="button"
                      onClick={() => choose(receipt)}
                    >
                      <strong>{receipt.receiptNumber}</strong>
                      <span>
                        ₹{receipt.amount.toLocaleString("en-IN")}
                        {" · "}
                        {receipt.receiptDate}
                        {" · "}
                        {receipt.paymentMode}
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
