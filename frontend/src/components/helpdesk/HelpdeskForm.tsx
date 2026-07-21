"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  createHelpdeskTicket,
  triageHelpdeskTicket,
  useHelpdesk,
} from "@/hooks/useHelpdesk";

import {
  HelpdeskAiTriageResult,
  HelpdeskChannel,
  HelpdeskPriority,
} from "@/types/helpdesk";

export default function HelpdeskForm({
  residentMode = false,
}: {
  residentMode?: boolean;
}) {
  const router =
    useRouter();

  const {
    categories,
    loading,
  } = useHelpdesk();

  const [
    form,
    setForm,
  ] = useState({
    title: "",
    description: "",
    categoryId: "",
    propertyId: "",
    spaceId: "",
    requesterPersonId: "",
    priority:
      "MEDIUM" as HelpdeskPriority,
    channel:
      "WEB" as HelpdeskChannel,
  });

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    aiTenantId,
    setAiTenantId,
  ] = useState("");

  const [
    aiBusy,
    setAiBusy,
  ] = useState(false);

  const [
    aiError,
    setAiError,
  ] = useState("");

  const [
    aiResult,
    setAiResult,
  ] = useState<
    HelpdeskAiTriageResult | null
  >(null);

  async function runAiTriage() {
    if (
      !aiTenantId.trim() ||
      !form.title.trim() ||
      !form.description.trim()
    ) {
      setAiError(
        "Tenant ID, title, and description are required for AI triage.",
      );
      return;
    }

    setAiBusy(true);
    setAiError("");
    setAiResult(null);

    try {
      const selectedCategory =
        categories.find(
          (category) =>
            category.id ===
            form.categoryId,
        );

      const result =
        await triageHelpdeskTicket({
          tenantId:
            aiTenantId.trim(),
          title:
            form.title.trim(),
          description:
            form.description.trim(),
          categoryId:
            selectedCategory?.id,
          categoryName:
            selectedCategory?.name,
          priority:
            form.priority,
          channel:
            form.channel,
        });

      const suggestedCategory =
        result.suggestedCategory
          ?.trim()
          .toLowerCase();

      const matchedCategory =
        suggestedCategory
          ? categories.find(
              (category) =>
                category.name
                  .trim()
                  .toLowerCase() ===
                  suggestedCategory ||
                category.code
                  .trim()
                  .toLowerCase() ===
                  suggestedCategory,
            )
          : undefined;

      setForm((current) => ({
        ...current,
        priority:
          result.suggestedPriority,
        categoryId:
          matchedCategory?.id ??
          current.categoryId,
      }));

      setAiResult(result);
    } catch (caught) {
      setAiError(
        caught instanceof Error
          ? caught.message
          : "Unable to complete AI triage.",
      );
    } finally {
      setAiBusy(false);
    }
  }

  async function submit(
    event: FormEvent,
  ) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const ticket =
        await createHelpdeskTicket({
          ...form,
          spaceId:
            form.spaceId ||
            undefined,
        });

      router.push(
        residentMode
          ? "/resident/helpdesk"
          : `/helpdesk/${ticket.id}`,
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to create helpdesk ticket.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      className="form-card"
      onSubmit={submit}
    >
      <div className="form-grid">
        <label>
          Title
          <input
            required
            value={form.title}
            onChange={(event) =>
              setForm({
                ...form,
                title:
                  event.target.value,
              })
            }
          />
        </label>

        <label>
          Category
          <select
            required
            disabled={loading}
            value={form.categoryId}
            onChange={(event) =>
              setForm({
                ...form,
                categoryId:
                  event.target.value,
              })
            }
          >
            <option value="">
              Select category
            </option>

            {categories.map(
              (category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ),
            )}
          </select>
        </label>

        <label>
          Priority
          <select
            value={form.priority}
            onChange={(event) =>
              setForm({
                ...form,
                priority:
                  event.target
                    .value as HelpdeskPriority,
              })
            }
          >
            {[
              "LOW",
              "MEDIUM",
              "HIGH",
              "URGENT",
            ].map(
              (value) => (
                <option
                  key={value}
                  value={value}
                >
                  {value}
                </option>
              ),
            )}
          </select>
        </label>

        <label>
          Channel
          <select
            value={form.channel}
            onChange={(event) =>
              setForm({
                ...form,
                channel:
                  event.target
                    .value as HelpdeskChannel,
              })
            }
          >
            {[
              "WEB",
              "MOBILE",
              "WHATSAPP",
              "EMAIL",
              "PHONE",
              "ADMIN",
            ].map(
              (value) => (
                <option
                  key={value}
                  value={value}
                >
                  {value}
                </option>
              ),
            )}
          </select>
        </label>

        <label>
          Property ID
          <input
            required
            value={form.propertyId}
            onChange={(event) =>
              setForm({
                ...form,
                propertyId:
                  event.target.value,
              })
            }
          />
        </label>

        <label>
          Space ID
          <input
            value={form.spaceId}
            onChange={(event) =>
              setForm({
                ...form,
                spaceId:
                  event.target.value,
              })
            }
          />
        </label>

        <label>
          Requester Person ID
          <input
            required
            value={
              form.requesterPersonId
            }
            onChange={(event) =>
              setForm({
                ...form,
                requesterPersonId:
                  event.target.value,
              })
            }
          />
        </label>
      </div>

      <label>
        Description
        <textarea
          required
          rows={6}
          value={form.description}
          onChange={(event) =>
            setForm({
              ...form,
              description:
                event.target.value,
            })
          }
        />
      </label>

      <section className="panel">
        <div className="stack-sm">
          <div>
            <p className="eyebrow">
              AI Assistant
            </p>
            <h2>
              Ticket triage
            </h2>
            <p>
              Review advisory category,
              priority, and summary suggestions
              before creating the ticket.
            </p>
          </div>

          <label>
            Tenant ID for AI policy
            <input
              value={aiTenantId}
              onChange={(event) =>
                setAiTenantId(
                  event.target.value,
                )
              }
              placeholder="Tenant ID"
            />
          </label>

          <div className="form-actions">
            <button
              className="secondary-button"
              disabled={
                aiBusy ||
                !form.title.trim() ||
                !form.description.trim()
              }
              onClick={() => {
                void runAiTriage();
              }}
              type="button"
            >
              {aiBusy
                ? "Analysing…"
                : "Suggest with AI"}
            </button>
          </div>

          {aiError ? (
            <div className="error-state">
              <p>{aiError}</p>
            </div>
          ) : null}

          {aiResult ? (
            <article className="panel">
              <div className="stack-sm">
                <div>
                  <strong>
                    Suggested priority
                  </strong>
                  <p>
                    {
                      aiResult.suggestedPriority
                    }
                  </p>
                </div>

                <div>
                  <strong>
                    Suggested category
                  </strong>
                  <p>
                    {
                      aiResult.suggestedCategory ??
                      "No category suggestion"
                    }
                  </p>
                </div>

                <div>
                  <strong>
                    Suggested summary
                  </strong>
                  <p>
                    {aiResult.summary}
                  </p>
                </div>

                <div>
                  <strong>
                    Confidence
                  </strong>
                  <p>
                    {Math.round(
                      aiResult.confidence *
                        100,
                    )}
                    %
                  </p>
                </div>

                {aiResult.reasons.length >
                0 ? (
                  <div>
                    <strong>
                      Reasons
                    </strong>
                    <ul>
                      {aiResult.reasons.map(
                        (reason) => (
                          <li key={reason}>
                            {reason}
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                ) : null}

                <small>
                  Advisory only ·{" "}
                  {
                    aiResult.providerName
                  }
                  {aiResult.model
                    ? ` / ${aiResult.model}`
                    : ""}
                  {" · "}
                  Correlation ID:{" "}
                  {
                    aiResult.correlationId
                  }
                </small>
              </div>
            </article>
          ) : null}
        </div>
      </section>

      {error ? (
        <p className="text-danger">
          {error}
        </p>
      ) : null}

      <div className="form-actions">
        <button
          disabled={saving}
          type="submit"
        >
          {saving
            ? "Creating…"
            : "Create Ticket"}
        </button>
      </div>
    </form>
  );
}
