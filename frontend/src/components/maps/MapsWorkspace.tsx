"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  calculateMapRoute,
  geocodeAddress,
  reverseGeocodeCoordinate,
} from "@/hooks/useMaps";

import {
  MAPS_CONTRACT,
  MapsResult,
} from "@/types/maps";

import MapsHealthPanel from "./MapsHealthPanel";
import MapsResultPanel from "./MapsResultPanel";

export default function MapsWorkspace() {
  const [geocode, setGeocode] =
    useState({
      query: "",
      limit: "5",
      language: "",
      countryCode: "",
    });

  const [reverse, setReverse] =
    useState({
      latitude: "",
      longitude: "",
    });

  const [route, setRoute] =
    useState({
      originLatitude: "",
      originLongitude: "",
      destinationLatitude: "",
      destinationLongitude: "",
      profile: "driving",
    });

  const [
    geocodeResult,
    setGeocodeResult,
  ] = useState<
    MapsResult | undefined
  >();

  const [
    reverseResult,
    setReverseResult,
  ] = useState<
    MapsResult | undefined
  >();

  const [
    routeResult,
    setRouteResult,
  ] = useState<
    MapsResult | undefined
  >();

  const [loading, setLoading] =
    useState("");

  const [error, setError] =
    useState("");

  async function runGeocode(
    event: FormEvent,
  ) {
    event.preventDefault();
    setLoading("geocode");
    setError("");

    try {
      setGeocodeResult(
        await geocodeAddress({
          [MAPS_CONTRACT.geocodeQueryField]:
            geocode.query.trim(),
          limit:
            geocode.limit === ""
              ? undefined
              : Number(
                  geocode.limit,
                ),
          language:
            geocode.language.trim() ||
            undefined,
          countryCode:
            geocode.countryCode
              .trim() || undefined,
        }),
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to geocode address.",
      );
    } finally {
      setLoading("");
    }
  }

  async function runReverse(
    event: FormEvent,
  ) {
    event.preventDefault();
    setLoading("reverse");
    setError("");

    try {
      setReverseResult(
        await reverseGeocodeCoordinate({
          [MAPS_CONTRACT.latitudeField]:
            Number(
              reverse.latitude,
            ),
          [MAPS_CONTRACT.longitudeField]:
            Number(
              reverse.longitude,
            ),
        }),
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to reverse geocode coordinates.",
      );
    } finally {
      setLoading("");
    }
  }

  async function runRoute(
    event: FormEvent,
  ) {
    event.preventDefault();
    setLoading("route");
    setError("");

    const origin = {
      [MAPS_CONTRACT.latitudeField]:
        Number(
          route.originLatitude,
        ),
      [MAPS_CONTRACT.longitudeField]:
        Number(
          route.originLongitude,
        ),
    };

    const destination = {
      [MAPS_CONTRACT.latitudeField]:
        Number(
          route.destinationLatitude,
        ),
      [MAPS_CONTRACT.longitudeField]:
        Number(
          route.destinationLongitude,
        ),
    };

    try {
      setRouteResult(
        await calculateMapRoute({
          [MAPS_CONTRACT.routeOriginField]:
            origin,
          [MAPS_CONTRACT.routeDestinationField]:
            destination,
          profile:
            route.profile.trim() ||
            undefined,
        }),
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to calculate route.",
      );
    } finally {
      setLoading("");
    }
  }

  return (
    <div className="stack-lg">
      <MapsHealthPanel />

      {error ? (
        <div className="error-state">
          <p>{error}</p>
        </div>
      ) : null}

      <section className="panel">
        <div className="page-header">
          <div>
            <p className="eyebrow">
              Address Lookup
            </p>
            <h2>Geocode</h2>
          </div>
        </div>

        <form
          className="form-card"
          onSubmit={runGeocode}
        >
          <div className="form-grid">
            <label>
              Address or Place
              <input
                required
                value={geocode.query}
                onChange={(event) =>
                  setGeocode(
                    (current) => ({
                      ...current,
                      query:
                        event.target
                          .value,
                    }),
                  )
                }
              />
            </label>

            <label>
              Result Limit
              <input
                min="1"
                type="number"
                value={geocode.limit}
                onChange={(event) =>
                  setGeocode(
                    (current) => ({
                      ...current,
                      limit:
                        event.target
                          .value,
                    }),
                  )
                }
              />
            </label>

            <label>
              Language
              <input
                placeholder="en"
                value={
                  geocode.language
                }
                onChange={(event) =>
                  setGeocode(
                    (current) => ({
                      ...current,
                      language:
                        event.target
                          .value,
                    }),
                  )
                }
              />
            </label>

            <label>
              Country Code
              <input
                placeholder="in"
                value={
                  geocode.countryCode
                }
                onChange={(event) =>
                  setGeocode(
                    (current) => ({
                      ...current,
                      countryCode:
                        event.target
                          .value,
                    }),
                  )
                }
              />
            </label>
          </div>

          <div className="form-actions">
            <button
              disabled={
                loading === "geocode"
              }
              type="submit"
            >
              {loading === "geocode"
                ? "Searching…"
                : "Search Address"}
            </button>
          </div>
        </form>
      </section>

      <MapsResultPanel
        title="Geocode Result"
        result={geocodeResult}
      />

      <section className="panel">
        <div className="page-header">
          <div>
            <p className="eyebrow">
              Coordinate Lookup
            </p>
            <h2>Reverse Geocode</h2>
          </div>
        </div>

        <form
          className="form-card"
          onSubmit={runReverse}
        >
          <div className="form-grid">
            <label>
              Latitude
              <input
                required
                step="any"
                type="number"
                value={
                  reverse.latitude
                }
                onChange={(event) =>
                  setReverse(
                    (current) => ({
                      ...current,
                      latitude:
                        event.target
                          .value,
                    }),
                  )
                }
              />
            </label>

            <label>
              Longitude
              <input
                required
                step="any"
                type="number"
                value={
                  reverse.longitude
                }
                onChange={(event) =>
                  setReverse(
                    (current) => ({
                      ...current,
                      longitude:
                        event.target
                          .value,
                    }),
                  )
                }
              />
            </label>
          </div>

          <div className="form-actions">
            <button
              disabled={
                loading === "reverse"
              }
              type="submit"
            >
              {loading === "reverse"
                ? "Looking up…"
                : "Find Address"}
            </button>
          </div>
        </form>
      </section>

      <MapsResultPanel
        title="Reverse-Geocode Result"
        result={reverseResult}
      />

      <section className="panel">
        <div className="page-header">
          <div>
            <p className="eyebrow">
              Route Planning
            </p>
            <h2>Calculate Route</h2>
          </div>
        </div>

        <form
          className="form-card"
          onSubmit={runRoute}
        >
          <div className="form-grid">
            <label>
              Origin Latitude
              <input
                required
                step="any"
                type="number"
                value={
                  route.originLatitude
                }
                onChange={(event) =>
                  setRoute(
                    (current) => ({
                      ...current,
                      originLatitude:
                        event.target
                          .value,
                    }),
                  )
                }
              />
            </label>

            <label>
              Origin Longitude
              <input
                required
                step="any"
                type="number"
                value={
                  route.originLongitude
                }
                onChange={(event) =>
                  setRoute(
                    (current) => ({
                      ...current,
                      originLongitude:
                        event.target
                          .value,
                    }),
                  )
                }
              />
            </label>

            <label>
              Destination Latitude
              <input
                required
                step="any"
                type="number"
                value={
                  route.destinationLatitude
                }
                onChange={(event) =>
                  setRoute(
                    (current) => ({
                      ...current,
                      destinationLatitude:
                        event.target
                          .value,
                    }),
                  )
                }
              />
            </label>

            <label>
              Destination Longitude
              <input
                required
                step="any"
                type="number"
                value={
                  route.destinationLongitude
                }
                onChange={(event) =>
                  setRoute(
                    (current) => ({
                      ...current,
                      destinationLongitude:
                        event.target
                          .value,
                    }),
                  )
                }
              />
            </label>

            <label>
              Routing Profile
              <select
                value={route.profile}
                onChange={(event) =>
                  setRoute(
                    (current) => ({
                      ...current,
                      profile:
                        event.target
                          .value,
                    }),
                  )
                }
              >
                <option value="driving">
                  Driving
                </option>
                <option value="walking">
                  Walking
                </option>
                <option value="cycling">
                  Cycling
                </option>
              </select>
            </label>
          </div>

          <div className="form-actions">
            <button
              disabled={
                loading === "route"
              }
              type="submit"
            >
              {loading === "route"
                ? "Calculating…"
                : "Calculate Route"}
            </button>
          </div>
        </form>
      </section>

      <MapsResultPanel
        title="Route Result"
        result={routeResult}
      />
    </div>
  );
}
