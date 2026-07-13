"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

type Props = {
  token: string;
  expiresAt?: string;
};

function formatDate(value?: string) {
  if (!value) {
    return "Not specified";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function QrPassCard({
  token,
  expiresAt,
}: Props) {
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;

    async function renderQr() {
      setError("");

      try {
        const result = await QRCode.toString(token, {
          type: "svg",
          width: 280,
          margin: 2,
          errorCorrectionLevel: "M",
        });

        if (active) {
          setSvg(result);
        }
      } catch (err) {
        if (active) {
          setSvg("");
          setError(
            err instanceof Error
              ? err.message
              : "Unable to render QR code.",
          );
        }
      }
    }

    void renderQr();

    return () => {
      active = false;
    };
  }, [token]);

  async function copyToken() {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setError("Unable to copy the QR token.");
    }
  }

  function downloadQr() {
    if (!svg) {
      return;
    }

    const blob = new Blob([svg], {
      type: "image/svg+xml;charset=utf-8",
    });

    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = objectUrl;
    link.download = `propertyos-visitor-pass-${token.slice(0, 8)}.svg`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(objectUrl);
  }

  return (
    <div className="qr-pass-card">
      {error && <p className="error">{error}</p>}

      {svg && (
        <div
          aria-label="Visitor QR pass"
          className="qr-pass-image"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      )}

      <div className="qr-pass-meta">
        <div>
          <span>Expires</span>
          <strong>{formatDate(expiresAt)}</strong>
        </div>

        <div>
          <span>Credential token</span>
          <code>{token}</code>
        </div>
      </div>

      <div className="actions qr-pass-actions">
        <button onClick={() => void copyToken()} type="button">
          {copied ? "Copied" : "Copy Token"}
        </button>

        <button
          className="secondary"
          disabled={!svg}
          onClick={downloadQr}
          type="button"
        >
          Download QR
        </button>
      </div>
    </div>
  );
}
