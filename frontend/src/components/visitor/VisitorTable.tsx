"use client";

import { useMemo, useState } from "react";
import { useVisitors } from "@/hooks/useVisitors";
import VisitorRow from "./VisitorRow";

const statuses = [
  "",
  "invited",
  "approved",
  "rejected",
  "arrived",
  "checked_in",
  "checked_out",
  "cancelled",
  "expired",
];

export default function VisitorTable() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [propertyId, setPropertyId] = useState("");

  const { items, loading, error, refresh } = useVisitors({
    status: status || undefined,
    propertyId: propertyId.trim() || undefined,
  });

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return items;
    }

    return items.filter((visit) => {
      const values = [
        visit.visitor?.fullName,
        visit.visitor?.mobile,
        visit.visitor?.email,
        visit.visitPurpose,
        visit.status,
      ];

      return values.some((value) =>
        value?.toLowerCase().includes(query),
      );
    });
  }, [items, search]);

  return (
    <>
      <div className="list-toolbar visitor-toolbar">
        <label>
          Search
          <input
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Name, mobile, email or purpose"
            type="search"
            value={search}
          />
        </label>

        <label>
          Status
          <select
            onChange={(event) => setStatus(event.target.value)}
            value={status}
          >
            {statuses.map((item) => (
              <option key={item || "all"} value={item}>
                {item
                  ? item.replaceAll("_", " ").replace(/\b\w/g, (letter) =>
                      letter.toUpperCase(),
                    )
                  : "All statuses"}
              </option>
            ))}
          </select>
        </label>

        <label>
          Property ID
          <input
            onChange={(event) => setPropertyId(event.target.value)}
            placeholder="Optional property filter"
            value={propertyId}
          />
        </label>

        <button onClick={() => void refresh()} type="button">
          Refresh
        </button>
      </div>

      {loading && <p>Loading visitors...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && visibleItems.length === 0 && (
        <p>No visitor records found.</p>
      )}

      {!loading && !error && visibleItems.length > 0 && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Visitor</th>
                <th>Mobile</th>
                <th>Purpose</th>
                <th>Visit Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.map((visit) => (
                <VisitorRow key={visit.id} visit={visit} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
