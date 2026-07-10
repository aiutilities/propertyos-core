"use client";

import { useEffect, useRef, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { Tenant, TenantListResponse } from "@/types/tenant";

type Props = {
  value: string;
  onChange: (tenantId: string) => void;
  required?: boolean;
  disabled?: boolean;
};

export default function TenantLookup({
  value,
  onChange,
  required = false,
  disabled = false,
}: Props) {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<Tenant[]>([]);
  const [selected, setSelected] = useState<Tenant | null>(null);
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
          sortBy: "tenantNumber",
          sortOrder: "asc",
        });

        if (search.trim()) {
          params.set("search", search.trim());
        }

        const response = await apiRequest<TenantListResponse>(
          `/tenants?${params.toString()}`,
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
            : "Unable to load tenants.",
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

  function choose(tenant: Tenant) {
    setSelected(tenant);
    setSearch("");
    setOpen(false);
    onChange(tenant.id);
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
        aria-label="Selected tenant ID"
        readOnly
        required={required}
        tabIndex={-1}
        value={value}
        className="entity-lookup-hidden-value"
      />

      {selected ? (
        <div className="entity-lookup-selection">
          <div>
            <strong>{selected.tenantNumber}</strong>
            <span>
              {selected.status}
              {selected.moveInDate
                ? ` · Moved in ${selected.moveInDate}`
                : ""}
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
            placeholder="Search by tenant number or status"
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
                  Loading tenants...
                </p>
              ) : null}

              {error ? (
                <p className="entity-lookup-message error-text">
                  {error}
                </p>
              ) : null}

              {!loading && !error && items.length === 0 ? (
                <p className="entity-lookup-message">
                  No tenants found.
                </p>
              ) : null}

              {!loading && !error
                ? items.map((tenant) => (
                    <button
                      className="entity-lookup-option"
                      key={tenant.id}
                      type="button"
                      onClick={() => choose(tenant)}
                    >
                      <strong>{tenant.tenantNumber}</strong>
                      <span>
                        {tenant.status}
                        {tenant.moveInDate
                          ? ` · ${tenant.moveInDate}`
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
