"use client";

import Link from "next/link";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  acknowledgeCommunication,
  archiveCommunication,
  cancelCommunication,
  expireCommunication,
  getCommunication,
  getCommunicationEngagement,
  markCommunicationRead,
  publishCommunication,
  scheduleCommunication,
} from "@/hooks/useCommunications";

import {
  CommunicationDetails as Details,
  CommunicationEngagementMetrics,
} from "@/types/communication";

import {
  CommunicationAudienceBadge,
} from "./CommunicationAudienceBadge";

import {
  CommunicationPriorityBadge,
} from "./CommunicationPriorityBadge";

import {
  CommunicationStatusBadge,
} from "./CommunicationStatusBadge";

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

export default function CommunicationDetails({
  communicationId,
  residentMode = false,
}: {
  communicationId: string;
  residentMode?: boolean;
}) {
  const [
    communication,
    setCommunication,
  ] = useState<Details | null>(
    null,
  );

  const [
    engagement,
    setEngagement,
  ] = useState<CommunicationEngagementMetrics | null>(
    null,
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    busy,
    setBusy,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    actorPersonId,
    setActorPersonId,
  ] = useState("");

  const [
    remarks,
    setRemarks,
  ] = useState("");

  const [
    publishAt,
    setPublishAt,
  ] = useState("");

  const [
    expiresAt,
    setExpiresAt,
  ] = useState("");

  const load =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const details =
          await getCommunication(
            communicationId,
          );

        setCommunication(details);

        if (!residentMode) {
          setEngagement(
            await getCommunicationEngagement(
              communicationId,
            ),
          );
        }
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to load communication.",
        );
      } finally {
        setLoading(false);
      }
    }, [
      communicationId,
      residentMode,
    ]);

  useEffect(() => {
    void load();
  }, [load]);

  async function run(
    action: () => Promise<unknown>,
  ) {
    setBusy(true);
    setError("");

    try {
      await action();
      setRemarks("");
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to update communication.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function schedule(
    event: FormEvent,
  ) {
    event.preventDefault();

    if (
      !actorPersonId ||
      !publishAt
    ) {
      setError(
        "Changed By Person ID and Publish At are required.",
      );
      return;
    }

    await run(
      () =>
        scheduleCommunication(
          communicationId,
          {
            changedByPersonId:
              actorPersonId,
            publishAt:
              new Date(
                publishAt,
              ).toISOString(),
            expiresAt:
              expiresAt
                ? new Date(
                    expiresAt,
                  ).toISOString()
                : undefined,
            remarks:
              remarks || undefined,
          },
        ),
    );
  }

  async function transition(
    action:
      | "publish"
      | "expire"
      | "archive"
      | "cancel",
  ) {
    if (!actorPersonId) {
      setError(
        "Changed By Person ID is required.",
      );
      return;
    }

    const input = {
      changedByPersonId:
        actorPersonId,
      remarks:
        remarks || undefined,
    };

    const actions = {
      publish: () =>
        publishCommunication(
          communicationId,
          input,
        ),
      expire: () =>
        expireCommunication(
          communicationId,
          input,
        ),
      archive: () =>
        archiveCommunication(
          communicationId,
          input,
        ),
      cancel: () =>
        cancelCommunication(
          communicationId,
          input,
        ),
    };

    await run(actions[action]);
  }

  async function markRead() {
    if (!actorPersonId) {
      setError(
        "Person ID is required.",
      );
      return;
    }

    await run(
      () =>
        markCommunicationRead(
          communicationId,
          actorPersonId,
        ),
    );
  }

  async function acknowledge() {
    if (!actorPersonId) {
      setError(
        "Person ID is required.",
      );
      return;
    }

    await run(
      () =>
        acknowledgeCommunication(
          communicationId,
          actorPersonId,
        ),
    );
  }

  if (loading) {
    return (
      <div className="loading-state">
        Loading communication…
      </div>
    );
  }

  if (!communication) {
    return (
      <div className="error-state">
        <p>
          {error ||
            "Communication not found."}
        </p>
      </div>
    );
  }

  return (
    <div className="stack-lg">
      <div className="page-header">
        <div>
          <p className="eyebrow">
            {residentMode
              ? "Resident Notice"
              : "Community Communications"}
          </p>

          <h1>
            {communication.title}
          </h1>

          <p>
            {
              communication.communicationNumber
            }
          </p>
        </div>

        <Link
          className="secondary-button"
          href={
            residentMode
              ? "/resident/notices"
              : "/communications"
          }
        >
          Back
        </Link>
      </div>

      {error ? (
        <div className="error-state">
          <p>{error}</p>
        </div>
      ) : null}

      <section className="detail-grid">
        <article className="panel">
          <div className="button-row">
            <CommunicationStatusBadge
              status={
                communication.status
              }
            />

            <CommunicationPriorityBadge
              priority={
                communication.priority
              }
            />

            {communication.isPinned ? (
              <span className="status-badge">
                PINNED
              </span>
            ) : null}
          </div>

          <dl className="detail-list">
            <div>
              <dt>Type</dt>
              <dd>
                {communication.type}
              </dd>
            </div>

            <div>
              <dt>Category</dt>
              <dd>
                {communication.category?.name ??
                  communication.categoryId}
              </dd>
            </div>

            <div>
              <dt>Property</dt>
              <dd>
                {communication.propertyId}
              </dd>
            </div>

            <div>
              <dt>Publish At</dt>
              <dd>
                {formatDate(
                  communication.publishAt,
                )}
              </dd>
            </div>

            <div>
              <dt>Published At</dt>
              <dd>
                {formatDate(
                  communication.publishedAt,
                )}
              </dd>
            </div>

            <div>
              <dt>Expires At</dt>
              <dd>
                {formatDate(
                  communication.expiresAt,
                )}
              </dd>
            </div>

            <div>
              <dt>Acknowledgement</dt>
              <dd>
                {communication.requiresAcknowledgement
                  ? "Required"
                  : "Not required"}
              </dd>
            </div>
          </dl>

          {communication.summary ? (
            <>
              <h3>Summary</h3>
              <p>
                {communication.summary}
              </p>
            </>
          ) : null}

          <h3>Content</h3>
          <p>
            {communication.content}
          </p>

          <h3>Audience</h3>

          <div className="button-row">
            {communication.targets.map(
              (target) => (
                <CommunicationAudienceBadge
                  audience={
                    target.audienceType
                  }
                  key={target.id}
                />
              ),
            )}
          </div>
        </article>

        <article className="panel stack-md">
          <h2>
            {residentMode
              ? "Reader Identity"
              : "Lifecycle Actions"}
          </h2>

          <label>
            Person ID
            <input
              value={actorPersonId}
              onChange={(event) =>
                setActorPersonId(
                  event.target.value,
                )
              }
            />
          </label>

          {!residentMode ? (
            <>
              <label>
                Remarks
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={(event) =>
                    setRemarks(
                      event.target.value,
                    )
                  }
                />
              </label>

              {communication.status ===
              "DRAFT" ? (
                <form
                  className="stack-md"
                  onSubmit={schedule}
                >
                  <label>
                    Publish At
                    <input
                      required
                      type="datetime-local"
                      value={publishAt}
                      onChange={(event) =>
                        setPublishAt(
                          event.target.value,
                        )
                      }
                    />
                  </label>

                  <label>
                    Expires At
                    <input
                      type="datetime-local"
                      value={expiresAt}
                      onChange={(event) =>
                        setExpiresAt(
                          event.target.value,
                        )
                      }
                    />
                  </label>

                  <button
                    disabled={busy}
                    type="submit"
                  >
                    Schedule
                  </button>
                </form>
              ) : null}

              <div className="button-row">
                {[
                  "DRAFT",
                  "SCHEDULED",
                ].includes(
                  communication.status,
                ) ? (
                  <button
                    disabled={busy}
                    onClick={() =>
                      void transition(
                        "publish",
                      )
                    }
                  >
                    Publish
                  </button>
                ) : null}

                {communication.status ===
                "PUBLISHED" ? (
                  <button
                    className="secondary-button"
                    disabled={busy}
                    onClick={() =>
                      void transition(
                        "expire",
                      )
                    }
                  >
                    Expire
                  </button>
                ) : null}

                {[
                  "PUBLISHED",
                  "EXPIRED",
                ].includes(
                  communication.status,
                ) ? (
                  <button
                    className="secondary-button"
                    disabled={busy}
                    onClick={() =>
                      void transition(
                        "archive",
                      )
                    }
                  >
                    Archive
                  </button>
                ) : null}

                {[
                  "DRAFT",
                  "SCHEDULED",
                ].includes(
                  communication.status,
                ) ? (
                  <button
                    className="secondary-button"
                    disabled={busy}
                    onClick={() =>
                      void transition(
                        "cancel",
                      )
                    }
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </>
          ) : (
            <div className="button-row">
              <button
                disabled={busy}
                onClick={() =>
                  void markRead()
                }
              >
                Mark as Read
              </button>

              {communication.requiresAcknowledgement ? (
                <button
                  className="secondary-button"
                  disabled={busy}
                  onClick={() =>
                    void acknowledge()
                  }
                >
                  Acknowledge
                </button>
              ) : null}
            </div>
          )}
        </article>
      </section>

      {!residentMode ? (
        <section className="detail-grid">
          <article className="panel">
            <h2>Engagement</h2>

            <dl className="detail-list">
              <div>
                <dt>Total Reads</dt>
                <dd>
                  {engagement?.totalReads ??
                    0}
                </dd>
              </div>

              <div>
                <dt>Acknowledgements</dt>
                <dd>
                  {engagement?.totalAcknowledgements ??
                    0}
                </dd>
              </div>
            </dl>
          </article>

          <article className="panel">
            <h2>Read Receipts</h2>

            {communication.reads.length ? (
              <div className="stack-md">
                {communication.reads.map(
                  (read) => (
                    <article
                      className="subtle-card"
                      key={read.id}
                    >
                      <strong>
                        {read.personId}
                      </strong>

                      <p>
                        Read:{" "}
                        {formatDate(
                          read.readAt,
                        )}
                      </p>

                      <p>
                        Acknowledged:{" "}
                        {formatDate(
                          read.acknowledgedAt,
                        )}
                      </p>
                    </article>
                  ),
                )}
              </div>
            ) : (
              <p>
                No read receipts yet.
              </p>
            )}
          </article>
        </section>
      ) : null}

      <section className="panel">
        <h2>Status History</h2>

        {communication.history.length ? (
          <div className="stack-md">
            {communication.history.map(
              (entry) => (
                <article
                  className="subtle-card"
                  key={entry.id}
                >
                  <strong>
                    {entry.fromStatus
                      ? `${entry.fromStatus} → `
                      : ""}
                    {entry.toStatus}
                  </strong>

                  <p>
                    {entry.remarks ??
                      "No remarks"}
                  </p>

                  <small>
                    {formatDate(
                      entry.createdAt,
                    )}
                    {" · "}
                    {
                      entry.changedByPersonId
                    }
                  </small>
                </article>
              ),
            )}
          </div>
        ) : (
          <p>
            No lifecycle history.
          </p>
        )}
      </section>
    </div>
  );
}
