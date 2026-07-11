"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";

interface QrValidationResponse {
  success: boolean;
  data: {
    valid: boolean;
    visitId?: string;
    reason?: string;
  };
}

export default function QrValidationPanel() {
  const [qrToken, setQrToken] = useState("");
  const [validating, setValidating] = useState(false);
  const [result, setResult] =
    useState<QrValidationResponse["data"] | null>(null);
  const [error, setError] = useState("");

  async function validate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const token = qrToken.trim();

    if (!token) {
      setError("Enter or scan a QR token.");
      return;
    }

    setValidating(true);
    setResult(null);
    setError("");

    try {
      const response = await apiRequest<QrValidationResponse>(
        "/plugins/visitor/validate-qr",
        {
          method: "POST",
          body: JSON.stringify({
            qrToken: token,
          }),
        },
      );

      setResult(response.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to validate the QR pass.",
      );
    } finally {
      setValidating(false);
    }
  }

  function reset() {
    setQrToken("");
    setResult(null);
    setError("");
  }

  return (
    <section className="security-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Gate Verification</p>
          <h2>Validate visitor QR pass</h2>
        </div>
      </div>

      <form className="security-qr-form" onSubmit={validate}>
        <label>
          QR token
          <input
            autoComplete="off"
            autoFocus
            disabled={validating}
            onChange={(event) => setQrToken(event.target.value)}
            placeholder="Scan or paste QR token"
            value={qrToken}
          />
        </label>

        <div className="actions">
          <button disabled={validating} type="submit">
            {validating ? "Validating..." : "Validate Pass"}
          </button>

          <button
            className="secondary"
            disabled={validating}
            onClick={reset}
            type="button"
          >
            Clear
          </button>
        </div>
      </form>

      {error && <p className="error">{error}</p>}

      {result?.valid && result.visitId && (
        <div className="security-result security-result-valid">
          <strong>Valid visitor pass</strong>
          <p>The QR credential is active and ready for gate processing.</p>

          <Link
            className="button-link"
            href={`/visitors/${result.visitId}`}
          >
            Open Visitor Record
          </Link>
        </div>
      )}

      {result && !result.valid && (
        <div className="security-result security-result-invalid">
          <strong>Invalid visitor pass</strong>
          <p>
            Reason:{" "}
            {(result.reason ?? "Unknown")
              .replaceAll("_", " ")
              .toLowerCase()}
          </p>
        </div>
      )}
    </section>
  );
}
