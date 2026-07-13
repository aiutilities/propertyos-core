"use client";

import {
  useState,
} from "react";

import PropertyLookup from "@/components/common/PropertyLookup";
import {
  useReservationResources,
} from "@/hooks/useReservations";
import {
  ReservationResourceType,
} from "@/types/reservation";

import ReservationResourceTable from "./ReservationResourceTable";

const resourceTypes:
  ReservationResourceType[] = [
    "FACILITY",
    "ROOM",
    "DESK",
    "PARKING",
    "EQUIPMENT",
    "AMENITY",
    "SERVICE",
    "OTHER",
  ];

export default function ReservationResourceDashboard() {
  const [
    propertyId,
    setPropertyId,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    resourceType,
    setResourceType,
  ] = useState<
    ReservationResourceType | ""
  >("");

  const [
    isActive,
    setIsActive,
  ] = useState<
    boolean | ""
  >("");

  const {
    resources,
    loading,
    error,
    refresh,
  } = useReservationResources({
    propertyId,
    search,
    resourceType,
    isActive,
  });

  return (
    <div className="stack-lg">
      <section className="panel">
        <div className="form-grid">
          <label>
            Property
            <PropertyLookup
              value={propertyId}
              onChange={setPropertyId}
            />
          </label>

          <label>
            Resource Type
            <select
              value={resourceType}
              onChange={(event) =>
                setResourceType(
                  event.target
                    .value as
                    | ReservationResourceType
                    | "",
                )
              }
            >
              <option value="">
                All resource types
              </option>

              {resourceTypes.map(
                (value) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {value.replaceAll(
                      "_",
                      " ",
                    )}
                  </option>
                ),
              )}
            </select>
          </label>

          <label>
            Status
            <select
              value={
                isActive === ""
                  ? ""
                  : String(isActive)
              }
              onChange={(event) =>
                setIsActive(
                  event.target.value === ""
                    ? ""
                    : event.target.value ===
                        "true",
                )
              }
            >
              <option value="">
                All statuses
              </option>
              <option value="true">
                Active
              </option>
              <option value="false">
                Inactive
              </option>
            </select>
          </label>

          <label>
            Search
            <input
              placeholder="Search name, code or description"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
            />
          </label>
        </div>

        <div className="form-actions">
          <button
            className="secondary-button"
            onClick={refresh}
          >
            Refresh
          </button>
        </div>
      </section>

      {loading ? (
        <div className="loading-state">
          Loading booking resources…
        </div>
      ) : null}

      {error ? (
        <div className="error-state">
          <p>{error}</p>
          <button onClick={refresh}>
            Retry
          </button>
        </div>
      ) : null}

      {!loading && !error ? (
        <ReservationResourceTable
          resources={resources}
        />
      ) : null}
    </div>
  );
}
