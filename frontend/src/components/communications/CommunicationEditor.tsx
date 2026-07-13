"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  createCommunication,
  useCommunications,
} from "@/hooks/useCommunications";

import {
  CommunicationPriority,
  CommunicationTargetInput,
  CommunicationType,
} from "@/types/communication";

import RecipientSelector from "./RecipientSelector";

export default function CommunicationEditor() {
  const router =
    useRouter();

  const {
    categories,
    loading,
  } = useCommunications();

  const [
    form,
    setForm,
  ] = useState({
    propertyId: "",
    categoryId: "",
    type:
      "ANNOUNCEMENT" as CommunicationType,
    title: "",
    summary: "",
    content: "",
    priority:
      "NORMAL" as CommunicationPriority,
    isPinned: false,
    requiresAcknowledgement:
      false,
    publishAt: "",
    expiresAt: "",
    createdByPersonId: "",
  });

  const [
    targets,
    setTargets,
  ] = useState<
    CommunicationTargetInput[]
  >([
    {
      audienceType:
        "ALL_PROPERTY",
    },
  ]);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  async function submit(
    event: FormEvent,
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      const communication =
        await createCommunication({
          ...form,
          summary:
            form.summary.trim() ||
            undefined,
          publishAt:
            form.publishAt ||
            undefined,
          expiresAt:
            form.expiresAt ||
            undefined,
          targets,
        });

      router.push(
        `/communications/${communication.id}`,
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to create communication.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      className="form-card stack-lg"
      onSubmit={submit}
    >
      <div className="form-grid">
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
          Category
          <select
            disabled={loading}
            required
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
          Type
          <select
            value={form.type}
            onChange={(event) =>
              setForm({
                ...form,
                type:
                  event.target
                    .value as CommunicationType,
              })
            }
          >
            {[
              "ANNOUNCEMENT",
              "NOTICE",
              "ALERT",
              "EVENT",
              "POLL",
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
          Priority
          <select
            value={form.priority}
            onChange={(event) =>
              setForm({
                ...form,
                priority:
                  event.target
                    .value as CommunicationPriority,
              })
            }
          >
            {[
              "LOW",
              "NORMAL",
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
          Created By Person ID
          <input
            required
            value={
              form.createdByPersonId
            }
            onChange={(event) =>
              setForm({
                ...form,
                createdByPersonId:
                  event.target.value,
              })
            }
          />
        </label>

        <label>
          Publish At
          <input
            type="datetime-local"
            value={form.publishAt}
            onChange={(event) =>
              setForm({
                ...form,
                publishAt:
                  event.target.value,
              })
            }
          />
        </label>

        <label>
          Expires At
          <input
            type="datetime-local"
            value={form.expiresAt}
            onChange={(event) =>
              setForm({
                ...form,
                expiresAt:
                  event.target.value,
              })
            }
          />
        </label>
      </div>

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
        Summary
        <textarea
          rows={3}
          value={form.summary}
          onChange={(event) =>
            setForm({
              ...form,
              summary:
                event.target.value,
            })
          }
        />
      </label>

      <label>
        Content
        <textarea
          required
          rows={10}
          value={form.content}
          onChange={(event) =>
            setForm({
              ...form,
              content:
                event.target.value,
            })
          }
        />
      </label>

      <div className="form-grid">
        <label>
          <input
            checked={form.isPinned}
            onChange={(event) =>
              setForm({
                ...form,
                isPinned:
                  event.target.checked,
              })
            }
            type="checkbox"
          />
          Pin communication
        </label>

        <label>
          <input
            checked={
              form.requiresAcknowledgement
            }
            onChange={(event) =>
              setForm({
                ...form,
                requiresAcknowledgement:
                  event.target.checked,
              })
            }
            type="checkbox"
          />
          Require acknowledgement
        </label>
      </div>

      <RecipientSelector
        onChange={setTargets}
        targets={targets}
      />

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
            : "Create Communication"}
        </button>
      </div>
    </form>
  );
}
