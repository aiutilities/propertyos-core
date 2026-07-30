"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  submitForm,
} from "@/hooks/useForms";

import {
  FormDefinition,
} from "@/types/forms";

export default function FormSubmissionDialog({
  form,
  onSubmitted,
}: {
  form: FormDefinition;
  onSubmitted: () => void;
}) {
  const [values, setValues] =
    useState("{}");

  const [
    submittedByPersonId,
    setSubmittedByPersonId,
  ] = useState("");

  const [metadata, setMetadata] =
    useState("{}");

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  async function submit(
    event: FormEvent,
  ) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await submitForm(form.id, {
        values: JSON.parse(values),
        submittedByPersonId:
          submittedByPersonId.trim() ||
          undefined,
        metadata: JSON.parse(
          metadata || "{}",
        ),
      });

      setValues("{}");
      setMetadata("{}");
      setSubmittedByPersonId("");
      onSubmitted();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to submit form.",
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
      <h2>Submit Response</h2>

      <label>
        Submitted By Person ID
        <input
          value={submittedByPersonId}
          onChange={(event) =>
            setSubmittedByPersonId(
              event.target.value,
            )
          }
        />
      </label>

      <label>
        Values JSON
        <textarea
          required
          rows={14}
          value={values}
          onChange={(event) =>
            setValues(event.target.value)
          }
          style={{
            fontFamily: "monospace",
          }}
        />
      </label>

      <label>
        Metadata JSON
        <textarea
          rows={6}
          value={metadata}
          onChange={(event) =>
            setMetadata(
              event.target.value,
            )
          }
          style={{
            fontFamily: "monospace",
          }}
        />
      </label>

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
            ? "Submitting…"
            : "Submit Response"}
        </button>
      </div>
    </form>
  );
}
