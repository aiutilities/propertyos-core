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
  useHelpdesk,
} from "@/hooks/useHelpdesk";

import {
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
