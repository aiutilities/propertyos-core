"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  getForm,
  listFormSubmissions,
  updateFormStatus,
} from "@/hooks/useForms";

import {
  FormDefinition,
  FormStatus,
  FormSubmission,
} from "@/types/forms";

import FormSubmissionDialog from "./FormSubmissionDialog";
import FormSubmissionTable from "./FormSubmissionTable";

export default function FormDetails({
  formId,
}: {
  formId: string;
}) {
  const [form, setForm] =
    useState<FormDefinition | null>(
      null,
    );

  const [
    submissions,
    setSubmissions,
  ] = useState<FormSubmission[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const [
        definition,
        responses,
      ] = await Promise.all([
        getForm(formId),
        listFormSubmissions(formId),
      ]);

      setForm(definition);
      setSubmissions(responses);
    } catch (caught) {
      setForm(null);
      setSubmissions([]);
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load form.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [formId]);

  async function changeStatus(
    status: FormStatus,
  ) {
    setSaving(true);
    setError("");

    try {
      setForm(
        await updateFormStatus(
          formId,
          status,
        ),
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to update form status.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="loading-state">
        Loading form…
      </div>
    );
  }

  if (!form) {
    return (
      <div className="error-state">
        <p>
          {error || "Form not found."}
        </p>
        <button onClick={load}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="stack-lg">
      <div className="page-header">
        <div>
          <p className="eyebrow">
            Form Definition
          </p>
          <h1>{form.name}</h1>
          <p className="muted-text">
            {form.code} · {form.status}
          </p>
        </div>

        <Link
          className="secondary-button"
          href="/forms"
        >
          Back to Forms
        </Link>
      </div>

      <section className="panel">
        <div className="details-grid">
          <div>
            <span className="muted-text">
              Status
            </span>
            <strong>{form.status}</strong>
          </div>

          <div>
            <span className="muted-text">
              Version
            </span>
            <strong>
              {form.version ?? 1}
            </strong>
          </div>

          <div>
            <span className="muted-text">
              Fields
            </span>
            <strong>
              {form.fields?.length ?? 0}
            </strong>
          </div>
        </div>

        {form.description ? (
          <p>{form.description}</p>
        ) : null}

        <div className="form-actions">
          {form.status !== "ACTIVE" ? (
            <button
              disabled={saving}
              onClick={() =>
                changeStatus("ACTIVE")
              }
            >
              Activate
            </button>
          ) : null}

          {form.status !== "ARCHIVED" ? (
            <button
              className="secondary-button"
              disabled={saving}
              onClick={() =>
                changeStatus("ARCHIVED")
              }
            >
              Archive
            </button>
          ) : null}

          {form.status !== "DRAFT" ? (
            <button
              className="secondary-button"
              disabled={saving}
              onClick={() =>
                changeStatus("DRAFT")
              }
            >
              Return to Draft
            </button>
          ) : null}
        </div>

        {error ? (
          <p className="text-danger">
            {error}
          </p>
        ) : null}
      </section>

      <section className="panel">
        <h2>Field Definition</h2>

        <pre
          style={{
            margin: 0,
            overflowX: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {JSON.stringify(
            form.fields,
            null,
            2,
          )}
        </pre>
      </section>

      {form.status === "ACTIVE" ? (
        <FormSubmissionDialog
          form={form}
          onSubmitted={load}
        />
      ) : null}

      <section className="panel">
        <div className="page-header">
          <div>
            <p className="eyebrow">
              Responses
            </p>
            <h2>Form Submissions</h2>
          </div>

          <button
            className="secondary-button"
            onClick={load}
          >
            Refresh
          </button>
        </div>

        <FormSubmissionTable
          submissions={submissions}
        />
      </section>
    </div>
  );
}
