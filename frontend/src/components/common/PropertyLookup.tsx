"use client";

import { useEffect, useRef, useState } from "react";
import { apiRequest } from "@/lib/api";
import type {
  Property,
  PropertyListResponse,
} from "@/types/property";

type Props = {
  value: string;
  onChange: (propertyId: string) => void;
  required?: boolean;
  disabled?: boolean;
};

export default function PropertyLookup({
  value,
  onChange,
  required = false,
  disabled = false,
}: Props) {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<Property[]>([]);
  const [selected, setSelected] =
    useState<Property | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const requestSequence = useRef(0);

  useEffect(() => {
    if (!value) {
      setSelected(null);
      return;
    }

    const currentRequest = ++requestSequence.current;

    apiRequest<{
      success: boolean;
      data: Property;
    }>(`/properties/${value}`)
      .then((response) => {
        if (currentRequest !== requestSequence.current) {
          return;
        }

        setSelected(response.data);
      })
      .catch(() => {
        if (currentRequest !== requestSequence.current) {
          return;
        }

        setSelected(null);
      });
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
          sortBy: "name",
          sortOrder: "asc",
        });

        if (search.trim()) {
          params.set("search", search.trim());
        }

        const response =
          await apiRequest<PropertyListResponse>(
            `/properties?${params.toString()}`,
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
            : "Unable to load properties.",
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

  function choose(property: Property) {
    setSelected(property);
    setSearch("");
    setOpen(false);
    onChange(property.id);
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
        aria-label="Selected property ID"
        className="entity-lookup-hidden-value"
        readOnly
        required={required}
        tabIndex={-1}
        value={value}
      />

      {selected ? (
        <div className="entity-lookup-selection">
          <div>
            <strong>{selected.name}</strong>
            <span>
              {selected.code ? `${selected.code} · ` : ""}
              {selected.city ?? "Location unavailable"}
              {" · "}
              {selected.isActive ? "Active" : "Inactive"}
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
            placeholder="Search by property name, code or city"
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
                  Loading properties...
                </p>
              ) : null}

              {error ? (
                <p className="entity-lookup-message error-text">
                  {error}
                </p>
              ) : null}

              {!loading && !error && items.length === 0 ? (
                <p className="entity-lookup-message">
                  No properties found.
                </p>
              ) : null}

              {!loading && !error
                ? items.map((property) => (
                    <button
                      className="entity-lookup-option"
                      key={property.id}
                      type="button"
                      onClick={() => choose(property)}
                    >
                      <strong>{property.name}</strong>
                      <span>
                        {property.code
                          ? `${property.code} · `
                          : ""}
                        {property.city ?? "Location unavailable"}
                        {" · "}
                        {property.isActive
                          ? "Active"
                          : "Inactive"}
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
