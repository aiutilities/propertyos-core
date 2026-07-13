"use client";

import {
  FormEvent,
  useState,
} from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import CameraQrScanner from "@/components/qr/CameraQrScanner";
import VisitorStatusBadge from "@/components/visitor/VisitorStatusBadge";
import type {
  Visit,
  VisitResponse,
} from "@/types/visitor";

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
  const [visit, setVisit] = useState<Visit | null>(null);
  const [error, setError] = useState("");

  async function validateToken(token: string) {
    const normalizedToken = token.trim();

    if (!normalizedToken) {
      setError("Enter or scan a QR token.");
      return;
    }

    setQrToken(normalizedToken);
    setValidating(true);
    setResult(null);
    setVisit(null);
    setError("");

    try {
      const response = await apiRequest<QrValidationResponse>(
        "/plugins/visitor/validate-qr",
        {
          method: "POST",
          body: JSON.stringify({
            qrToken: normalizedToken,
          }),
        },
      );

      setResult(response.data);

      if (response.data.valid && response.data.visitId) {
        const visitResponse = await apiRequest<VisitResponse>(
          `/plugins/visitor/${response.data.visitId}`,
        );

        setVisit(visitResponse.data);
      }
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

  async function validate(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    await validateToken(qrToken);
  }

  function reset() {
    setQrToken("");
    setResult(null);
    setVisit(null);
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

      <div className="security-scanner-layout">
        <CameraQrScanner
          onDetected={(value) => {
            void validateToken(value);
          }}
        />

        <form
          className="security-qr-form"
          onSubmit={validate}
        >
          <label>
            QR token
            <input
              autoComplete="off"
              disabled={validating}
              onChange={(event) =>
                setQrToken(event.target.value)
              }
              placeholder="Scan or paste QR token"
              value={qrToken}
            />
          </label>

          <div className="actions">
            <button disabled={validating} type="submit">
              {validating
                ? "Validating..."
                : "Validate Pass"}
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
      </div>

      {error && <p className="error">{error}</p>}

      {result?.valid && result.visitId && (
        <div className="security-result security-result-valid">
          <strong>Valid visitor pass</strong>
          <p>
            The QR credential is active and ready for gate
            processing.
          </p>

          {visit && (
            <div className="validated-visitor-card">
              <div>
                <p className="eyebrow">Visitor</p>
                <h3>
                  {visit.visitor?.fullName ?? "Visitor"}
                </h3>
                <p>
                  {visit.visitor?.mobile ??
                    "Mobile unavailable"}
                </p>
                <p>
                  {visit.visitPurpose ??
                    "Purpose not provided"}
                </p>
              </div>

              <VisitorStatusBadge status={visit.status} />
            </div>
          )}

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
