"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  findNearbyPlaces,
  getPlaceDetails,
  searchPlaces,
} from "@/hooks/usePlaces";

import {
  PlacesResult,
} from "@/types/places";

import PlacesHealthPanel from "./PlacesHealthPanel";
import PlacesResultPanel from "./PlacesResultPanel";

function parsePayload(
  value: string,
): Record<string, unknown> {
  const parsed = JSON.parse(value);

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    Array.isArray(parsed)
  ) {
    throw new Error(
      "Request payload must be a JSON object.",
    );
  }

  return parsed;
}

export default function PlacesWorkspace() {
  const [searchPayload, setSearchPayload] =
    useState(
      `{
  "query": "restaurants in Chennai",
  "limit": 10
}`,
    );

  const [nearbyPayload, setNearbyPayload] =
    useState(
      `{
  "latitude": 13.0827,
  "longitude": 80.2707,
  "radiusMeters": 1000,
  "category": "restaurant"
}`,
    );

  const [detailsPayload, setDetailsPayload] =
    useState(
      `{
  "placeId": ""
}`,
    );

  const [
    searchResult,
    setSearchResult,
  ] = useState<
    PlacesResult | undefined
  >();

  const [
    nearbyResult,
    setNearbyResult,
  ] = useState<
    PlacesResult | undefined
  >();

  const [
    detailsResult,
    setDetailsResult,
  ] = useState<
    PlacesResult | undefined
  >();

  const [loading, setLoading] =
    useState("");

  const [error, setError] =
    useState("");

  async function execute(
    operation:
      | "search"
      | "nearby"
      | "details",
    event: FormEvent,
  ) {
    event.preventDefault();
    setLoading(operation);
    setError("");

    try {
      if (operation === "search") {
        setSearchResult(
          await searchPlaces(
            parsePayload(
              searchPayload,
            ),
          ),
        );
      }

      if (operation === "nearby") {
        setNearbyResult(
          await findNearbyPlaces(
            parsePayload(
              nearbyPayload,
            ),
          ),
        );
      }

      if (operation === "details") {
        setDetailsResult(
          await getPlaceDetails(
            parsePayload(
              detailsPayload,
            ),
          ),
        );
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : `Unable to execute Places ${operation}.`,
      );
    } finally {
      setLoading("");
    }
  }

  return (
    <div className="stack-lg">
      <PlacesHealthPanel />

      {error ? (
        <div className="error-state">
          <p>{error}</p>
        </div>
      ) : null}

      <section className="panel">
        <div className="page-header">
          <div>
            <p className="eyebrow">
              Place Discovery
            </p>
            <h2>Search Places</h2>
          </div>
        </div>

        <form
          className="form-card"
          onSubmit={(event) =>
            execute(
              "search",
              event,
            )
          }
        >
          <label>
            Search Request JSON
            <textarea
              required
              rows={10}
              value={searchPayload}
              onChange={(event) =>
                setSearchPayload(
                  event.target.value,
                )
              }
              style={{
                fontFamily: "monospace",
              }}
            />
          </label>

          <div className="form-actions">
            <button
              disabled={
                loading === "search"
              }
              type="submit"
            >
              {loading === "search"
                ? "Searching…"
                : "Search Places"}
            </button>
          </div>
        </form>
      </section>

      <PlacesResultPanel
        title="Search Results"
        result={searchResult}
      />

      <section className="panel">
        <div className="page-header">
          <div>
            <p className="eyebrow">
              Proximity Search
            </p>
            <h2>Nearby Places</h2>
          </div>
        </div>

        <form
          className="form-card"
          onSubmit={(event) =>
            execute(
              "nearby",
              event,
            )
          }
        >
          <label>
            Nearby Request JSON
            <textarea
              required
              rows={12}
              value={nearbyPayload}
              onChange={(event) =>
                setNearbyPayload(
                  event.target.value,
                )
              }
              style={{
                fontFamily: "monospace",
              }}
            />
          </label>

          <div className="form-actions">
            <button
              disabled={
                loading === "nearby"
              }
              type="submit"
            >
              {loading === "nearby"
                ? "Searching…"
                : "Find Nearby Places"}
            </button>
          </div>
        </form>
      </section>

      <PlacesResultPanel
        title="Nearby Results"
        result={nearbyResult}
      />

      <section className="panel">
        <div className="page-header">
          <div>
            <p className="eyebrow">
              Place Record
            </p>
            <h2>Place Details</h2>
          </div>
        </div>

        <form
          className="form-card"
          onSubmit={(event) =>
            execute(
              "details",
              event,
            )
          }
        >
          <label>
            Details Request JSON
            <textarea
              required
              rows={8}
              value={detailsPayload}
              onChange={(event) =>
                setDetailsPayload(
                  event.target.value,
                )
              }
              style={{
                fontFamily: "monospace",
              }}
            />
          </label>

          <div className="form-actions">
            <button
              disabled={
                loading === "details"
              }
              type="submit"
            >
              {loading === "details"
                ? "Loading…"
                : "Load Place Details"}
            </button>
          </div>
        </form>
      </section>

      <PlacesResultPanel
        title="Place Details"
        result={detailsResult}
      />
    </div>
  );
}
