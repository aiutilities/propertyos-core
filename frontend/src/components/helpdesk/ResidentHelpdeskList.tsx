"use client";

import Link from "next/link";

import {
  useState,
} from "react";

import {
  useHelpdesk,
} from "@/hooks/useHelpdesk";

import HelpdeskTable from "./HelpdeskTable";

export default function ResidentHelpdeskList() {
  const [
    requesterPersonId,
    setRequesterPersonId,
  ] = useState("");

  const {
    items,
    loading,
    error,
    refresh,
  } = useHelpdesk({
    requesterPersonId:
      requesterPersonId ||
      undefined,
  });

  return (
    <div className="stack-lg">
      <section className="panel">
        <div className="toolbar">
          <input
            aria-label="Requester person ID"
            onChange={(event) =>
              setRequesterPersonId(
                event.target.value,
              )
            }
            placeholder="Requester Person ID"
            value={requesterPersonId}
          />

          <button
            className="secondary-button"
            onClick={refresh}
          >
            Refresh
          </button>

          <Link
            className="button-link"
            href="/resident/helpdesk/new"
          >
            Raise Ticket
          </Link>
        </div>
      </section>

      {loading ? (
        <div className="loading-state">
          Loading your helpdesk tickets…
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
        <HelpdeskTable
          items={items}
          residentMode
        />
      ) : null}
    </div>
  );
}
