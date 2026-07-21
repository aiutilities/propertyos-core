"use client";

import Link from "next/link";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  addHelpdeskComment,
  addHelpdeskWorklog,
  assignHelpdeskTicket,
  cancelHelpdeskTicket,
  closeHelpdeskTicket,
  draftHelpdeskAiReply,
  retrieveHelpdeskKnowledge,
  escalateHelpdeskTicket,
  getHelpdeskTicket,
  reopenHelpdeskTicket,
  resolveHelpdeskTicket,
  startHelpdeskProgress,
  submitHelpdeskFeedback,
} from "@/hooks/useHelpdesk";

import {
  HelpdeskAiReplySuggestion,
  HelpdeskKnowledgeEvidence,
  HelpdeskStatus,
  HelpdeskTicket,
  HelpdeskVisibility,
} from "@/types/helpdesk";

import {
  HelpdeskPriorityBadge,
} from "./HelpdeskPriorityBadge";

import {
  HelpdeskSlaCountdown,
} from "./HelpdeskSlaCountdown";

import {
  HelpdeskStatusBadge,
} from "./HelpdeskStatusBadge";

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

function statusLabel(
  status: HelpdeskStatus,
) {
  return status.replaceAll(
    "_",
    " ",
  );
}

export default function HelpdeskDetails({
  ticketId,
  residentMode = false,
}: {
  ticketId: string;
  residentMode?: boolean;
}) {
  const [
    ticket,
    setTicket,
  ] = useState<HelpdeskTicket | null>(
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
    assigneePersonId,
    setAssigneePersonId,
  ] = useState("");

  const [
    remarks,
    setRemarks,
  ] = useState("");

  const [
    resolutionSummary,
    setResolutionSummary,
  ] = useState("");

  const [
    commentBody,
    setCommentBody,
  ] = useState("");

  const [
    commentVisibility,
    setCommentVisibility,
  ] = useState<HelpdeskVisibility>(
    "PUBLIC",
  );

  const [
    worklogMinutes,
    setWorklogMinutes,
  ] = useState("30");

  const [
    worklogDescription,
    setWorklogDescription,
  ] = useState("");

  const [
    feedbackRating,
    setFeedbackRating,
  ] = useState("5");

  const [
    feedbackComments,
    setFeedbackComments,
  ] = useState("");

  const [
    aiTenantId,
    setAiTenantId,
  ] = useState("");

  const [
    aiInternalNotes,
    setAiInternalNotes,
  ] = useState("");

  const [
    aiGroundWithKnowledge,
    setAiGroundWithKnowledge,
  ] = useState(true);

  const [
    aiReplyBusy,
    setAiReplyBusy,
  ] = useState(false);

  const [
    aiReplyError,
    setAiReplyError,
  ] = useState("");

  const [
    aiReply,
    setAiReply,
  ] = useState<
    HelpdeskAiReplySuggestion | null
  >(null);

  const [
    copyStatus,
    setCopyStatus,
  ] = useState("");


  const [
    knowledgeQuery,
    setKnowledgeQuery,
  ] = useState("");

  const [
    knowledgeLimit,
    setKnowledgeLimit,
  ] = useState("5");

  const [
    knowledgeBusy,
    setKnowledgeBusy,
  ] = useState(false);

  const [
    knowledgeError,
    setKnowledgeError,
  ] = useState("");

  const [
    knowledgeResults,
    setKnowledgeResults,
  ] = useState<
    HelpdeskKnowledgeEvidence[]
  >([]);

  const [
    knowledgeSearchCompleted,
    setKnowledgeSearchCompleted,
  ] = useState(false);

  const [
    knowledgeSearchContext,
    setKnowledgeSearchContext,
  ] = useState("");

  const load =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        setTicket(
          await getHelpdeskTicket(
            ticketId,
          ),
        );
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to load helpdesk ticket.",
        );
      } finally {
        setLoading(false);
      }
    }, [ticketId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runAction(
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
          : "Unable to update helpdesk ticket.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function assign(
    event: FormEvent,
  ) {
    event.preventDefault();

    if (
      !assigneePersonId ||
      !actorPersonId
    ) {
      setError(
        "Assignee Person ID and Changed By Person ID are required.",
      );
      return;
    }

    await runAction(
      () =>
        assignHelpdeskTicket(
          ticketId,
          {
            assigneePersonId,
            changedByPersonId:
              actorPersonId,
            remarks:
              remarks || undefined,
          },
        ),
    );
  }

  async function transition(
    action:
      | "start"
      | "escalate"
      | "reopen"
      | "close"
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
      start: () =>
        startHelpdeskProgress(
          ticketId,
          input,
        ),
      escalate: () =>
        escalateHelpdeskTicket(
          ticketId,
          input,
        ),
      reopen: () =>
        reopenHelpdeskTicket(
          ticketId,
          input,
        ),
      close: () =>
        closeHelpdeskTicket(
          ticketId,
          input,
        ),
      cancel: () =>
        cancelHelpdeskTicket(
          ticketId,
          input,
        ),
    };

    await runAction(
      actions[action],
    );
  }

  async function resolve(
    event: FormEvent,
  ) {
    event.preventDefault();

    if (
      !actorPersonId ||
      !resolutionSummary.trim()
    ) {
      setError(
        "Changed By Person ID and resolution summary are required.",
      );
      return;
    }

    await runAction(
      () =>
        resolveHelpdeskTicket(
          ticketId,
          {
            changedByPersonId:
              actorPersonId,
            resolutionSummary:
              resolutionSummary.trim(),
            remarks:
              remarks || undefined,
          },
        ),
    );

    setResolutionSummary("");
  }

  async function comment(
    event: FormEvent,
  ) {
    event.preventDefault();

    if (
      !actorPersonId ||
      !commentBody.trim()
    ) {
      setError(
        "Author Person ID and comment are required.",
      );
      return;
    }

    await runAction(
      () =>
        addHelpdeskComment(
          ticketId,
          {
            authorPersonId:
              actorPersonId,
            body:
              commentBody.trim(),
            visibility:
              commentVisibility,
          },
        ),
    );

    setCommentBody("");
  }

  async function worklog(
    event: FormEvent,
  ) {
    event.preventDefault();

    const minutes =
      Number(worklogMinutes);

    if (
      !actorPersonId ||
      !Number.isInteger(minutes) ||
      minutes <= 0 ||
      !worklogDescription.trim()
    ) {
      setError(
        "Person ID, positive minutes, and description are required.",
      );
      return;
    }

    await runAction(
      () =>
        addHelpdeskWorklog(
          ticketId,
          {
            personId:
              actorPersonId,
            minutesSpent:
              minutes,
            description:
              worklogDescription.trim(),
          },
        ),
    );

    setWorklogDescription("");
  }

  async function feedback(
    event: FormEvent,
  ) {
    event.preventDefault();

    const rating =
      Number(feedbackRating);

    if (
      !actorPersonId ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      setError(
        "Person ID and a rating from 1 to 5 are required.",
      );
      return;
    }

    await runAction(
      () =>
        submitHelpdeskFeedback(
          ticketId,
          {
            submittedByPersonId:
              actorPersonId,
            rating,
            comments:
              feedbackComments.trim() ||
              undefined,
          },
        ),
    );

    setFeedbackComments("");
  }

  async function generateAiReply() {
    if (!ticket) {
      setAiReplyError(
        "Helpdesk ticket is not available.",
      );
      return;
    }

    if (!aiTenantId.trim()) {
      setAiReplyError(
        "Tenant ID is required for AI policy evaluation.",
      );
      return;
    }

    setAiReplyBusy(true);
    setAiReplyError("");
    setAiReply(null);
    setCopyStatus("");

    try {
      const result =
        await draftHelpdeskAiReply({
          tenantId:
            aiTenantId.trim(),
          ticketId:
            ticket.id,
          subject:
            ticket.title,
          customerMessage:
            ticket.description,
          internalNotes:
            aiInternalNotes.trim() ||
            undefined,
          groundWithKnowledge:
            aiGroundWithKnowledge,
          knowledgeLimit: 5,
        });

      setAiReply(result);
    } catch (caught) {
      setAiReplyError(
        caught instanceof Error
          ? caught.message
          : "Unable to generate an AI reply.",
      );
    } finally {
      setAiReplyBusy(false);
    }
  }


  async function retrieveKnowledge() {
    if (!ticket) {
      setKnowledgeError(
        "Helpdesk ticket is not available.",
      );
      return;
    }

    const tenantId =
      aiTenantId.trim();

    if (!tenantId) {
      setKnowledgeError(
        "Tenant ID is required for knowledge retrieval.",
      );
      return;
    }

    const parsedLimit =
      Number(knowledgeLimit);

    if (
      !Number.isInteger(parsedLimit) ||
      ![3, 5, 10].includes(parsedLimit)
    ) {
      setKnowledgeError(
        "Knowledge result limit must be 3, 5, or 10.",
      );
      return;
    }

    const explicitQuery =
      knowledgeQuery.trim();

    const effectiveQuery =
      explicitQuery || ticket.title;

    setKnowledgeBusy(true);
    setKnowledgeError("");
    setKnowledgeResults([]);
    setKnowledgeSearchCompleted(false);
    setKnowledgeSearchContext("");

    try {
      const result =
        await retrieveHelpdeskKnowledge({
          tenantId,
          query: effectiveQuery,
          limit: parsedLimit,
        });

      setKnowledgeResults(
        result.evidence,
      );

      setKnowledgeSearchContext(
        explicitQuery
          ? `Results for “${effectiveQuery}”`
          : `Results for ticket title “${effectiveQuery}”`,
      );

      setKnowledgeSearchCompleted(true);
    } catch (caught) {
      setKnowledgeError(
        caught instanceof Error
          ? caught.message
          : "Unable to retrieve knowledge.",
      );
    } finally {
      setKnowledgeBusy(false);
    }
  }

  async function copyAiReply() {
    if (!aiReply) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        aiReply.reply,
      );

      setCopyStatus(
        "Reply copied to clipboard.",
      );
    } catch {
      setCopyStatus(
        "Unable to copy the reply.",
      );
    }
  }

  function useAiReplyAsComment() {
    if (!aiReply) {
      return;
    }

    setCommentBody(
      aiReply.reply,
    );

    setCommentVisibility(
      "PUBLIC",
    );

    setCopyStatus(
      "Reply added to the comment editor. Review it before posting.",
    );
  }

  if (loading) {
    return (
      <div className="loading-state">
        Loading helpdesk ticket…
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="error-state">
        <p>
          {error ||
            "Helpdesk ticket not found."}
        </p>
      </div>
    );
  }

  const active =
    ![
      "CLOSED",
      "CANCELLED",
    ].includes(ticket.status);

  const canResolve =
    [
      "ASSIGNED",
      "IN_PROGRESS",
      "ESCALATED",
      "REOPENED",
    ].includes(ticket.status);

  const canFeedback =
    [
      "RESOLVED",
      "CLOSED",
    ].includes(ticket.status) &&
    !ticket.feedback;

  return (
    <div className="stack-lg">
      <div className="page-header">
        <div>
          <p className="eyebrow">
            {residentMode
              ? "Resident Helpdesk"
              : "Helpdesk Operations"}
          </p>

          <h1>
            {ticket.ticketNumber}
          </h1>

          <p>
            {ticket.title}
          </p>
        </div>

        <Link
          className="secondary-button"
          href={
            residentMode
              ? "/resident/helpdesk"
              : "/helpdesk"
          }
        >
          Back to Helpdesk
        </Link>
      </div>

      {error ? (
        <div className="error-state">
          <p>{error}</p>
        </div>
      ) : null}

      <section className="detail-grid">
        <article className="panel">
          <h2>Ticket Details</h2>

          <dl className="detail-list">
            <div>
              <dt>Status</dt>
              <dd>
                <HelpdeskStatusBadge
                  status={ticket.status}
                />
              </dd>
            </div>

            <div>
              <dt>Priority</dt>
              <dd>
                <HelpdeskPriorityBadge
                  priority={ticket.priority}
                />
              </dd>
            </div>

            <div>
              <dt>Category</dt>
              <dd>
                {ticket.category?.name ??
                  ticket.categoryId}
              </dd>
            </div>

            <div>
              <dt>Channel</dt>
              <dd>
                {ticket.channel}
              </dd>
            </div>

            <div>
              <dt>Property</dt>
              <dd>
                {ticket.propertyId}
              </dd>
            </div>

            <div>
              <dt>Space</dt>
              <dd>
                {ticket.spaceId ?? "—"}
              </dd>
            </div>

            <div>
              <dt>Requester</dt>
              <dd>
                {ticket.requesterPersonId}
              </dd>
            </div>

            <div>
              <dt>Assignee</dt>
              <dd>
                {ticket.assigneePersonId ??
                  "Unassigned"}
              </dd>
            </div>

            <div>
              <dt>Response Due</dt>
              <dd>
                {formatDate(
                  ticket.responseDueAt,
                )}
              </dd>
            </div>

            <div>
              <dt>Resolution Due</dt>
              <dd className="stack-xs">
                <span>
                  {formatDate(
                    ticket.resolutionDueAt,
                  )}
                </span>

                <HelpdeskSlaCountdown
                  dueAt={
                    ticket.resolutionDueAt
                  }
                />
              </dd>
            </div>

            <div>
              <dt>Created</dt>
              <dd>
                {formatDate(
                  ticket.createdAt,
                )}
              </dd>
            </div>
          </dl>

          <h3>Description</h3>
          <p>
            {ticket.description}
          </p>

          {ticket.resolutionSummary ? (
            <>
              <h3>Resolution</h3>
              <p>
                {ticket.resolutionSummary}
              </p>
            </>
          ) : null}
        </article>

        <article className="panel">
          <h2>Action Identity</h2>

          <label>
            Person ID performing actions
            <input
              value={actorPersonId}
              onChange={(event) =>
                setActorPersonId(
                  event.target.value,
                )
              }
              placeholder="Person UUID"
            />
          </label>

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

          {!residentMode ? (
            <>
              <form
                className="stack-md"
                onSubmit={assign}
              >
                <label>
                  Assignee Person ID
                  <input
                    value={
                      assigneePersonId
                    }
                    onChange={(event) =>
                      setAssigneePersonId(
                        event.target.value,
                      )
                    }
                  />
                </label>

                <button
                  disabled={busy}
                  type="submit"
                >
                  Assign Ticket
                </button>
              </form>

              <div className="button-row">
                {ticket.status ===
                "ASSIGNED" ? (
                  <button
                    disabled={busy}
                    onClick={() =>
                      void transition(
                        "start",
                      )
                    }
                  >
                    Start Progress
                  </button>
                ) : null}

                {active &&
                ticket.status !==
                  "ESCALATED" ? (
                  <button
                    className="secondary-button"
                    disabled={busy}
                    onClick={() =>
                      void transition(
                        "escalate",
                      )
                    }
                  >
                    Escalate
                  </button>
                ) : null}

                {[
                  "RESOLVED",
                  "CLOSED",
                ].includes(
                  ticket.status,
                ) ? (
                  <button
                    className="secondary-button"
                    disabled={busy}
                    onClick={() =>
                      void transition(
                        "reopen",
                      )
                    }
                  >
                    Reopen
                  </button>
                ) : null}

                {ticket.status ===
                "RESOLVED" ? (
                  <button
                    disabled={busy}
                    onClick={() =>
                      void transition(
                        "close",
                      )
                    }
                  >
                    Close
                  </button>
                ) : null}

                {active ? (
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

              {canResolve ? (
                <form
                  className="stack-md"
                  onSubmit={resolve}
                >
                  <h3>Resolve Ticket</h3>

                  <label>
                    Resolution summary
                    <textarea
                      required
                      rows={4}
                      value={
                        resolutionSummary
                      }
                      onChange={(
                        event,
                      ) =>
                        setResolutionSummary(
                          event.target
                            .value,
                        )
                      }
                    />
                  </label>

                  <button
                    disabled={busy}
                    type="submit"
                  >
                    Resolve Ticket
                  </button>
                </form>
              ) : null}
            </>
          ) : null}
        </article>
      </section>

      {!residentMode ? (
        <section className="panel stack-md">
          <div>
            <p className="eyebrow">
              AI Assistant
            </p>

            <h2>
              Draft customer reply
            </h2>

            <p>
              Generate an advisory response using
              the current ticket details. Review and
              edit every suggestion before posting.
            </p>
          </div>

          <div className="form-grid">
            <label>
              Tenant ID for AI policy
              <input
                value={aiTenantId}
                onChange={(event) => {
                  setAiTenantId(
                    event.target.value,
                  );
                  setAiReply(null);
                  setAiReplyError("");
                  setCopyStatus("");
                  setKnowledgeResults([]);
                  setKnowledgeError("");
                  setKnowledgeSearchCompleted(false);
                  setKnowledgeSearchContext("");
                }}
                placeholder="Tenant UUID"
              />
            </label>

            <label>
              Internal context
              <textarea
                rows={4}
                value={aiInternalNotes}
                onChange={(event) =>
                  setAiInternalNotes(
                    event.target.value,
                  )
                }
                placeholder="Add troubleshooting notes, actions taken, or response constraints"
              />
            </label>
          </div>

          <label className="plugin-checkbox">
            <input
              checked={
                aiGroundWithKnowledge
              }
              onChange={(event) =>
                setAiGroundWithKnowledge(
                  event.target.checked,
                )
              }
              type="checkbox"
            />

            <span>
              Ground the reply with available
              PropertyOS knowledge
            </span>
          </label>

          <div className="form-actions">
            <button
              disabled={
                aiReplyBusy ||
                knowledgeBusy ||
                !aiTenantId.trim()
              }
              onClick={() => {
                void generateAiReply();
              }}
              type="button"
            >
              {aiReplyBusy
                ? "Drafting reply…"
                : "Draft Reply with AI"}
            </button>

            {aiReply ? (
              <>
                <button
                  className="secondary-button"
                  onClick={() => {
                    void copyAiReply();
                  }}
                  type="button"
                >
                  Copy Reply
                </button>

                <button
                  className="secondary-button"
                  onClick={
                    useAiReplyAsComment
                  }
                  type="button"
                >
                  Use as Comment
                </button>
              </>
            ) : null}
          </div>

          {aiReplyError ? (
            <div
              className="error-state"
              role="alert"
            >
              <p>{aiReplyError}</p>
            </div>
          ) : null}

          {copyStatus ? (
            <p
              aria-live="polite"
              role="status"
            >
              <small>
                {copyStatus}
              </small>
            </p>
          ) : null}

          {aiReply ? (
            <article className="subtle-card">
              <div className="stack-md">
                <div>
                  <strong>
                    Suggested subject
                  </strong>

                  <p>
                    {aiReply.subject}
                  </p>
                </div>

                <div>
                  <strong>
                    Suggested reply
                  </strong>

                  <p
                    style={{
                      whiteSpace:
                        "pre-wrap",
                    }}
                  >
                    {aiReply.reply}
                  </p>
                </div>

                <dl className="detail-list">
                  <div>
                    <dt>Tone</dt>
                    <dd>
                      {aiReply.tone}
                    </dd>
                  </div>

                  <div>
                    <dt>Confidence</dt>
                    <dd>
                      {Math.round(
                        aiReply.confidence *
                          100,
                      )}
                      %
                    </dd>
                  </div>

                  <div>
                    <dt>Grounded</dt>
                    <dd>
                      {aiReply.grounded
                        ? "Yes"
                        : "No"}
                    </dd>
                  </div>

                  <div>
                    <dt>Evidence</dt>
                    <dd>
                      {
                        aiReply.evidenceCount
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>Provider</dt>
                    <dd>
                      {
                        aiReply.providerName
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>Model</dt>
                    <dd>
                      {aiReply.model ??
                        "Not specified"}
                    </dd>
                  </div>
                </dl>

                <small>
                  Advisory only · Correlation
                  ID:{" "}
                  {
                    aiReply.correlationId
                  }
                </small>
              </div>
            </article>
          ) : null}

        <section
          aria-busy={knowledgeBusy}
          className="panel stack-md"
        >
          <div>
            <p className="eyebrow">
              AI Assistant
            </p>

            <h2>Knowledge Search</h2>

            <p>
              Find supporting policies, SOPs, and
              knowledge records before preparing a
              customer response.
            </p>
          </div>

          <div className="form-grid">

            <label>
              Search
              <input
                value={knowledgeQuery}
                onChange={(event) => {
                  setKnowledgeQuery(
                    event.target.value,
                  );
                  setKnowledgeResults([]);
                  setKnowledgeError("");
                  setKnowledgeSearchCompleted(false);
                  setKnowledgeSearchContext("");
                }}
                placeholder="Search policies, SOPs or KB"
              />
            </label>

            <label>
              Limit
              <select
                value={knowledgeLimit}
                onChange={(event) => {
                  setKnowledgeLimit(
                    event.target.value,
                  );
                  setKnowledgeResults([]);
                  setKnowledgeError("");
                  setKnowledgeSearchCompleted(false);
                  setKnowledgeSearchContext("");
                }}
              >
                <option>3</option>
                <option>5</option>
                <option>10</option>
              </select>
            </label>

          </div>

          <div className="form-actions">
            <button
              aria-busy={knowledgeBusy}
              disabled={
                knowledgeBusy ||
                aiReplyBusy ||
                !aiTenantId.trim()
              }
              onClick={() => {
                void retrieveKnowledge();
              }}
              type="button"
            >
              {knowledgeBusy
                ? "Searching…"
                : "Search Knowledge"}
            </button>
          </div>

          <div
            aria-live="polite"
            role="status"
          >
            {knowledgeBusy ? (
              <p>
                Searching PropertyOS knowledge…
              </p>
            ) : null}

            {!knowledgeBusy &&
            knowledgeSearchCompleted ? (
              <p>
                <strong>
                  {knowledgeResults.length}
                </strong>{" "}
                {knowledgeResults.length === 1
                  ? "result"
                  : "results"}{" "}
                found. {knowledgeSearchContext}
              </p>
            ) : null}
          </div>

          {knowledgeError ? (
            <div
              className="error-state"
              role="alert"
            >
              <p>{knowledgeError}</p>
            </div>
          ) : null}

          {!knowledgeBusy &&
          knowledgeSearchCompleted &&
          knowledgeResults.length === 0 ? (
            <div className="empty-state">
              <h2>No knowledge found</h2>
              <p>
                Try a broader search phrase or use
                the current ticket title.
              </p>
            </div>
          ) : null}

          {knowledgeResults.length > 0 ? (
            <div className="stack-md">
              {knowledgeResults.map(
                (item, index) => (
                  <article
                    key={
                      item.id ||
                      `${item.entityType}-${index}`
                    }
                    className="subtle-card"
                  >

                    <strong>
                      {item.title}
                    </strong>

                    <p>
                      {item.description ??
                        "No description available."}
                    </p>

                    <dl className="detail-list">

                      <div>
                        <dt>Score</dt>
                        <dd>
                          {item.score !==
                          undefined
                            ? `${Math.round(
                                item.score *
                                  100,
                              )}%`
                            : "Not provided"}
                        </dd>
                      </div>

                      <div>
                        <dt>Type</dt>
                        <dd>
                          {item.entityType}
                        </dd>
                      </div>

                      <div>
                        <dt>Source</dt>
                        <dd>
                          {item.providerName ??
                            "Not specified"}
                        </dd>
                      </div>

                    </dl>

                  </article>
                )
              )}

            </div>

          ) : null}

        </section>

        </section>
      ) : null}

      {active ? (
        <section className="detail-grid">
          <form
            className="panel stack-md"
            onSubmit={comment}
          >
            <h2>Add Comment</h2>

            <label>
              Visibility
              <select
                value={
                  commentVisibility
                }
                onChange={(event) =>
                  setCommentVisibility(
                    event.target
                      .value as HelpdeskVisibility,
                  )
                }
              >
                <option value="PUBLIC">
                  Public
                </option>

                {!residentMode ? (
                  <option value="INTERNAL">
                    Internal
                  </option>
                ) : null}
              </select>
            </label>

            <label>
              Comment
              <textarea
                required
                rows={4}
                value={commentBody}
                onChange={(event) =>
                  setCommentBody(
                    event.target.value,
                  )
                }
              />
            </label>

            <button
              disabled={busy}
              type="submit"
            >
              Add Comment
            </button>
          </form>

          {!residentMode ? (
            <form
              className="panel stack-md"
              onSubmit={worklog}
            >
              <h2>Add Worklog</h2>

              <label>
                Minutes spent
                <input
                  min="1"
                  required
                  type="number"
                  value={
                    worklogMinutes
                  }
                  onChange={(event) =>
                    setWorklogMinutes(
                      event.target
                        .value,
                    )
                  }
                />
              </label>

              <label>
                Work performed
                <textarea
                  required
                  rows={4}
                  value={
                    worklogDescription
                  }
                  onChange={(event) =>
                    setWorklogDescription(
                      event.target
                        .value,
                    )
                  }
                />
              </label>

              <button
                disabled={busy}
                type="submit"
              >
                Add Worklog
              </button>
            </form>
          ) : null}
        </section>
      ) : null}

      {canFeedback ? (
        <form
          className="panel stack-md"
          onSubmit={feedback}
        >
          <h2>Submit Feedback</h2>

          <label>
            Rating
            <select
              value={feedbackRating}
              onChange={(event) =>
                setFeedbackRating(
                  event.target.value,
                )
              }
            >
              {[1, 2, 3, 4, 5].map(
                (rating) => (
                  <option
                    key={rating}
                    value={rating}
                  >
                    {rating}
                  </option>
                ),
              )}
            </select>
          </label>

          <label>
            Comments
            <textarea
              rows={4}
              value={feedbackComments}
              onChange={(event) =>
                setFeedbackComments(
                  event.target.value,
                )
              }
            />
          </label>

          <button
            disabled={busy}
            type="submit"
          >
            Submit Feedback
          </button>
        </form>
      ) : null}

      {ticket.feedback ? (
        <section className="panel">
          <h2>Customer Feedback</h2>
          <p>
            Rating:{" "}
            <strong>
              {ticket.feedback.rating}/5
            </strong>
          </p>
          <p>
            {ticket.feedback.comments ??
              "No comments provided."}
          </p>
        </section>
      ) : null}

      <section className="detail-grid">
        <article className="panel">
          <h2>Comments</h2>

          {ticket.comments?.length ? (
            <div className="stack-md">
              {ticket.comments.map(
                (comment) => (
                  <article
                    className="subtle-card"
                    key={comment.id}
                  >
                    <div className="page-header">
                      <strong>
                        {comment.visibility}
                      </strong>
                      <span>
                        {formatDate(
                          comment.createdAt,
                        )}
                      </span>
                    </div>

                    <p>
                      {comment.body}
                    </p>

                    <small>
                      By{" "}
                      {comment.authorPersonId}
                    </small>
                  </article>
                ),
              )}
            </div>
          ) : (
            <p>No comments yet.</p>
          )}
        </article>

        {!residentMode ? (
          <article className="panel">
            <h2>Worklogs</h2>

            {ticket.worklogs?.length ? (
              <div className="stack-md">
                {ticket.worklogs.map(
                  (worklog) => (
                    <article
                      className="subtle-card"
                      key={worklog.id}
                    >
                      <strong>
                        {
                          worklog.minutesSpent
                        }{" "}
                        minutes
                      </strong>

                      <p>
                        {
                          worklog.description
                        }
                      </p>

                      <small>
                        {formatDate(
                          worklog.workedAt,
                        )}
                        {" · "}
                        {
                          worklog.personId
                        }
                      </small>
                    </article>
                  ),
                )}
              </div>
            ) : (
              <p>No worklogs yet.</p>
            )}
          </article>
        ) : null}
      </section>

      <section className="panel">
        <h2>Ticket History</h2>

        {ticket.history?.length ? (
          <div className="stack-md">
            {ticket.history.map(
              (entry) => (
                <article
                  className="subtle-card"
                  key={entry.id}
                >
                  <strong>
                    {entry.fromStatus
                      ? `${statusLabel(
                          entry.fromStatus,
                        )} → `
                      : ""}
                    {statusLabel(
                      entry.toStatus,
                    )}
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
          <p>No history available.</p>
        )}
      </section>
    </div>
  );
}
