"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  createForm,
} from "@/hooks/useForms";

const INITIAL_FIELDS = `[
  {
    "key": "name",
    "label": "Name",
    "type": "TEXT",
    "required": true,
    "order": 1
  }
]`;

export default function FormEditor() {
  const router = useRouter();

  const [form, setForm] = useState({
    code: "",
    name: "",
    description: "",
    fields: INITIAL_FIELDS,
    settings: "{}",
    metadata: "{}",
  });

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  function update(
    name: string,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function submit(
    event: FormEvent,
  ) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const fields = JSON.parse(
        form.fields,
      );

      if (!Array.isArray(fields)) {
        throw new Error(
          "Fields must be a JSON array.",
        );
      }

      const created = await createForm({
        code: form.code.trim(),
        name: form.name.trim(),
        description:
          form.description.trim() ||
          undefined,
        fields,
        settings: JSON.parse(
          form.settings || "{}",
        ),
        metadata: JSON.parse(
          form.metadata || "{}",
        ),
      });

      router.push(`/forms/${created.id}`);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to create form.",
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
          Form Code
          <input
            required
            value={form.code}
            onChange={(event) =>
              update(
                "code",
                event.target.value,
              )
            }
          />
        </label>

        <label>
          Form Name
          <input
            required
            value={form.name}
            onChange={(event) =>
              update(
                "name",
                event.target.value,
              )
            }
          />
        </label>
      </div>

      <label>
        Description
        <textarea
          rows={3}
          value={form.description}
          onChange={(event) =>
            update(
              "description",
              event.target.value,
            )
          }
        />
      </label>

      <label>
        Fields JSON
        <textarea
          required
          rows={18}
          value={form.fields}
          onChange={(event) =>
            update(
              "fields",
              event.target.value,
            )
          }
          style={{
            fontFamily: "monospace",
          }}
        />
      </label>

      <div className="form-grid">
        <label>
          Settings JSON
          <textarea
            rows={8}
            value={form.settings}
            onChange={(event) =>
              update(
                "settings",
                event.target.value,
              )
            }
            style={{
              fontFamily: "monospace",
            }}
          />
        </label>

        <label>
          Metadata JSON
          <textarea
            rows={8}
            value={form.metadata}
            onChange={(event) =>
              update(
                "metadata",
                event.target.value,
              )
            }
            style={{
              fontFamily: "monospace",
            }}
          />
        </label>
      </div>

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
            : "Create Form"}
        </button>
      </div>
    </form>
  );
}
