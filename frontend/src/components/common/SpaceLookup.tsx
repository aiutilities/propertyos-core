"use client";

import { useEffect, useRef, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { Space, SpaceResponse } from "@/types/space";
import type { Tenant } from "@/types/tenant";

type TenantResponse = {
  success: boolean;
  data: Tenant;
};

type Props = {
  tenantId: string;
  value: string;
  onChange: (spaceId: string) => void;
  required?: boolean;
  disabled?: boolean;
};

export default function SpaceLookup({
  tenantId,
  value,
  onChange,
  required = false,
  disabled = false,
}: Props) {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<Space[]>([]);
  const [selected, setSelected] = useState<Space | null>(null);
  const [propertyId, setPropertyId] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const requestSequence = useRef(0);

  useEffect(() => {
    const currentRequest = ++requestSequence.current;

    setSearch("");
    setItems([]);
    setSelected(null);
    setPropertyId("");
    setOpen(false);
    setError("");

    if (!tenantId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    async function load() {
      try {
        const tenantResponse = await apiRequest<TenantResponse>(
          `/tenants/${tenantId}`,
        );

        if (currentRequest !== requestSequence.current) {
          return;
        }

        const tenantPropertyId = tenantResponse.data.propertyId;
        setPropertyId(tenantPropertyId);

        const spacesResponse = await apiRequest<SpaceResponse>(
          `/properties/${tenantPropertyId}/spaces`,
        );

        if (currentRequest !== requestSequence.current) {
          return;
        }

        setItems(spacesResponse.data);

        if (value) {
          setSelected(
            spacesResponse.data.find((space) => space.id === value) ?? null,
          );
        }
      } catch (err) {
        if (currentRequest !== requestSequence.current) {
          return;
        }

        setItems([]);
        setSelected(null);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load spaces for this tenant.",
        );
      } finally {
        if (currentRequest === requestSequence.current) {
          setLoading(false);
        }
      }
    }

    load();
  }, [tenantId, value]);

  const normalizedSearch = search.trim().toLowerCase();

  const filteredItems = normalizedSearch
    ? items.filter((space) => {
        const searchable = [
          space.name,
          space.code ?? "",
          space.spaceType ?? "",
          space.floor ?? "",
          space.description ?? "",
        ]
          .join(" ")
          .toLowerCase();

        return searchable.includes(normalizedSearch);
      })
    : items;

  function choose(space: Space) {
    setSelected(space);
    setSearch("");
    setOpen(false);
    onChange(space.id);
  }

  function clear() {
    setSelected(null);
    setSearch("");
    onChange("");
  }

  const lookupDisabled = disabled || !tenantId || loading;

  return (
    <div className="entity-lookup">
      <input
        aria-label="Selected space ID"
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
              {selected.spaceType ?? "Space"}
              {selected.floor ? ` · Floor ${selected.floor}` : ""}
              {" · "}
              {selected.isActive ? "Active" : "Inactive"}
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
              loading
                ? "Loading tenant spaces..."
                : tenantId
                  ? "Search by space name, code, type or floor"
                  : "Tenant is required"
            }
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
          />

          {open && tenantId ? (
            <div className="entity-lookup-menu">
              {loading ? (
                <p className="entity-lookup-message">
                  Loading spaces...
                </p>
              ) : null}

              {error ? (
                <p className="entity-lookup-message error-text">
                  {error}
                </p>
              ) : null}

              {!loading && !error && filteredItems.length === 0 ? (
                <p className="entity-lookup-message">
                  No spaces found for this tenant's property.
                </p>
              ) : null}

              {!loading && !error
                ? filteredItems.map((space) => (
                    <button
                      className="entity-lookup-option"
                      key={space.id}
                      type="button"
                      onClick={() => choose(space)}
                    >
                      <strong>{space.name}</strong>
                      <span>
                        {space.code ? `${space.code} · ` : ""}
                        {space.spaceType ?? "Space"}
                        {space.floor ? ` · Floor ${space.floor}` : ""}
                        {" · "}
                        {space.isActive ? "Active" : "Inactive"}
                      </span>
                    </button>
                  ))
                : null}
            </div>
          ) : null}

          {!loading && error && !open ? (
            <p className="entity-lookup-message error-text">
              {error}
            </p>
          ) : null}

          {propertyId ? (
            <input type="hidden" value={propertyId} readOnly />
          ) : null}
        </div>
      )}
    </div>
  );
}
