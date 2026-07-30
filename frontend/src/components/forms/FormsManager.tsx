"use client";

import {
  useState,
} from "react";

import {
  useForms,
} from "@/hooks/useForms";

import FormEditor from "./FormEditor";
import FormTable from "./FormTable";

export default function FormsManager() {
  const [status, setStatus] =
    useState("");

  const {
    forms,
    loading,
    error,
    refresh,
  } = useForms(status);

  return (
    <div className="stack-lg">
      <section className="panel">
        <div className="toolbar">
          <select
            aria-label="Filter form status"
            value={status}
            onChange={(event) =>
              setStatus(
                event.target.value,
              )
            }
          >
            <option value="">
              All statuses
            </option>
            <option value="DRAFT">
              DRAFT
            </option>
            <option value="ACTIVE">
              ACTIVE
            </option>
            <option value="ARCHIVED">
              ARCHIVED
            </option>
          </select>

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
          Loading forms…
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
        <FormTable forms={forms} />
      ) : null}

      <section className="panel">
        <div className="page-header">
          <div>
            <p className="eyebrow">
              Form Definition
            </p>
            <h2>Create Form</h2>
          </div>
        </div>

        <FormEditor />
      </section>
    </div>
  );
}
