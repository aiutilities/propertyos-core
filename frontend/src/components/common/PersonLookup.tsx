"use client";

import { useEffect, useRef, useState } from "react";
import { apiRequest } from "@/lib/api";
import type {
  Person,
  PersonListResponse,
  PersonResponse,
} from "@/types/person";

type Props = {
  value: string;
  onChange: (personId: string) => void;
  required?: boolean;
  disabled?: boolean;
};

export default function PersonLookup({
  value,
  onChange,
  required = false,
  disabled = false,
}: Props) {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<Person[]>([]);
  const [selected, setSelected] =
    useState<Person | null>(null);
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

    apiRequest<PersonResponse>(`/persons/${value}`)
      .then((response) => {
        if (currentRequest !== requestSequence.current) {
          return;
        }

        setSelected(response);
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
          await apiRequest<PersonListResponse>(
            `/persons?${params.toString()}`,
          );

        if (currentRequest !== requestSequence.current) {
          return;
        }

        setItems(response);
      } catch (err) {
        if (currentRequest !== requestSequence.current) {
          return;
        }

        setItems([]);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load people.",
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

  function choose(person: Person) {
    setSelected(person);
    setSearch("");
    setOpen(false);
    onChange(person.id);
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
        aria-label="Selected person ID"
        className="entity-lookup-hidden-value"
        readOnly
        required={required}
        tabIndex={-1}
        value={value}
      />

      {selected ? (
        <div className="entity-lookup-selection">
          <div>
            <strong>{selected.displayName}</strong>
            <span>
              {selected.email ?? "No email"}
              {" · "}
              {selected.phone ?? "No phone"}
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
            placeholder="Search by person name, code or city"
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
                  Loading people...
                </p>
              ) : null}

              {error ? (
                <p className="entity-lookup-message error-text">
                  {error}
                </p>
              ) : null}

              {!loading && !error && items.length === 0 ? (
                <p className="entity-lookup-message">
                  No people found.
                </p>
              ) : null}

              {!loading && !error
                ? items.map((person) => (
                    <button
                      className="entity-lookup-option"
                      key={person.id}
                      type="button"
                      onClick={() => choose(person)}
                    >
                      <strong>{person.displayName}</strong>
                      <span>
                        {person.email ?? "No email"}
                        {" · "}
                        {person.phone ?? "No phone"}
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
