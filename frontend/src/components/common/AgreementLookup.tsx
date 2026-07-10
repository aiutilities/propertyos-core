"use client";

import { useEffect, useRef, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { Lease, LeaseListResponse } from "@/types/lease";

type Props = {
  value?: string;
  onChange: (agreementId: string) => void;
  required?: boolean;
  disabled?: boolean;
};

export default function AgreementLookup({
  value = "",
  onChange,
  required = false,
  disabled = false,
}: Props) {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<Lease[]>([]);
  const [selected, setSelected] = useState<Lease | null>(null);
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
          sortBy: "agreementNumber",
          sortOrder: "asc",
        });

        if (search.trim()) {
          params.set("search", search.trim());
        }

        const response = await apiRequest<LeaseListResponse>(
          `/agreements?${params.toString()}`,
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
            : "Unable to load agreements.",
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

  function choose(agreement: Lease) {
    setSelected(agreement);
    setSearch("");
    setOpen(false);
    onChange(agreement.id);
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
        aria-label="Selected agreement ID"
        className="entity-lookup-hidden-value"
        readOnly
        required={required}
        tabIndex={-1}
        value={value}
      />

      {selected ? (
        <div className="entity-lookup-selection">
          <div>
            <strong>{selected.leaseNumber}</strong>
            <span>
              {selected.status} · Tenant {selected.tenantId}
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
            placeholder="Search by agreement number or status"
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
                  Loading agreements...
                </p>
              ) : null}

              {error ? (
                <p className="entity-lookup-message error-text">
                  {error}
                </p>
              ) : null}

              {!loading && !error && items.length === 0 ? (
                <p className="entity-lookup-message">
                  No agreements found.
                </p>
              ) : null}

              {!loading && !error
                ? items.map((agreement) => (
                    <button
                      className="entity-lookup-option"
                      key={agreement.id}
                      type="button"
                      onClick={() => choose(agreement)}
                    >
                      <strong>{agreement.leaseNumber}</strong>
                      <span>
                        {agreement.status} · Tenant {agreement.tenantId}
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
