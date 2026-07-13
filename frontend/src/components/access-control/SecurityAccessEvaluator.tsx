"use client";

import { useState } from "react";

import { evaluateAccess } from "@/hooks/useAccessControl";
import { AccessEvaluation, AccessEventType } from "@/types/access-control";

export default function SecurityAccessEvaluator() {
  const [form, setForm] = useState({
    propertyId: "",
    accessPointCode: "",
    credentialType: "QR",
    credentialValue: "",
    eventType: "ENTRY" as AccessEventType,
    recordedByPersonId: "",
  });

  const [result, setResult] = useState<AccessEvaluation | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function evaluate() {
    setBusy(true);
    setError("");
    setResult(null);

    try {
      setResult(
        await evaluateAccess({
          propertyId: form.propertyId,
          accessPointCode: form.accessPointCode,
          credentialType: form.credentialType,
          credentialValue: form.credentialValue,
          eventType: form.eventType,
          recordedByPersonId: form.recordedByPersonId || undefined,
        }),
      );
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to evaluate access.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack-lg">
      <section className="panel">
        <h2>Credential Evaluation</h2>

        <div className="form-grid">
          {Object.entries(form).map(([key, value]) =>
            key === "eventType" ? (
              <label key={key}>
                Event Type
                <select
                  value={value}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      eventType: event.target.value as AccessEventType,
                    })
                  }
                >
                  <option value="ENTRY">Entry</option>
                  <option value="EXIT">Exit</option>
                </select>
              </label>
            ) : (
              <label key={key}>
                {key.replace(/([A-Z])/g, " $1")}
                <input
                  value={String(value)}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      [key]: event.target.value,
                    })
                  }
                />
              </label>
            ),
          )}
        </div>

        <button disabled={busy} onClick={() => void evaluate()} type="button">
          Evaluate Access
        </button>
      </section>

      {error ? <div className="error-state">{error}</div> : null}

      {result ? (
        <section className="panel">
          <h2>{result.decision}</h2>

          <p>Access Point: {result.accessPoint.name}</p>

          <p>Event: {result.eventType}</p>

          <p>
            Subject: {result.subjectType ?? "Unknown"} {result.subjectId ?? ""}
          </p>

          {result.denialReason ? <p>Reason: {result.denialReason}</p> : null}
        </section>
      ) : null}
    </div>
  );
}
