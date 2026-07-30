"use client";

import {
  usePlacesHealth,
} from "@/hooks/usePlaces";

export default function PlacesHealthPanel() {
  const {
    health,
    loading,
    error,
    refresh,
  } = usePlacesHealth();

  return (
    <section className="panel">
      <div className="page-header">
        <div>
          <p className="eyebrow">
            Runtime Status
          </p>
          <h2>Places Health</h2>
        </div>

        <button
          className="secondary-button"
          onClick={refresh}
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="muted-text">
          Checking Places runtime…
        </p>
      ) : null}

      {error ? (
        <p className="text-danger">
          {error}
        </p>
      ) : null}

      {!loading &&
      !error &&
      health ? (
        <pre
          style={{
            margin: 0,
            overflowX: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {JSON.stringify(
            health,
            null,
            2,
          )}
        </pre>
      ) : null}
    </section>
  );
}
