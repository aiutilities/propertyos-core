"use client";

import Link from "next/link";

import {
  useState,
} from "react";

import {
  useCommunications,
} from "@/hooks/useCommunications";

import {
  CommunicationPriorityBadge,
} from "./CommunicationPriorityBadge";

function formatDate(
  value?: string,
) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(
    new Date(value),
  );
}

export default function ResidentNoticeBoard() {
  const [
    search,
    setSearch,
  ] = useState("");

  const {
    items,
    loading,
    error,
    refresh,
  } = useCommunications({
    status:
      "PUBLISHED",
    search,
  });

  return (
    <div className="stack-lg">
      <section className="panel">
        <div className="toolbar">
          <input
            aria-label="Search notices"
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
            placeholder="Search notices and announcements"
            value={search}
          />

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
          Loading community notices…
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

      {!loading &&
      !error &&
      items.length === 0 ? (
        <div className="empty-state">
          <h3>No active notices</h3>
          <p>
            Published community notices will
            appear here.
          </p>
        </div>
      ) : null}

      {!loading &&
      !error &&
      items.length > 0 ? (
        <div className="stack-md">
          {items.map(
            (item) => (
              <article
                className="panel"
                key={item.id}
              >
                <div className="page-header">
                  <div>
                    <p className="eyebrow">
                      {item.type}
                    </p>

                    <h2>
                      {item.isPinned
                        ? "📌 "
                        : ""}
                      {item.title}
                    </h2>
                  </div>

                  <CommunicationPriorityBadge
                    priority={
                      item.priority
                    }
                  />
                </div>

                <p>
                  {item.summary ??
                    item.content.slice(
                      0,
                      220,
                    )}
                </p>

                <div className="page-header">
                  <small>
                    Published:{" "}
                    {formatDate(
                      item.publishedAt,
                    )}
                  </small>

                  <Link
                    className="button-link"
                    href={`/resident/notices/${item.id}`}
                  >
                    Read Notice
                  </Link>
                </div>
              </article>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}
