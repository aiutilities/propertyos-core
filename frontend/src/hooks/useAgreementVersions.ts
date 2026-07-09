"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type {
  AgreementVersion,
  AgreementVersionResponse,
} from "@/types/agreement-version";

export function useAgreementVersions(agreementId: string) {
  const [versions, setVersions] = useState<AgreementVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await apiRequest<AgreementVersionResponse>(
          `/agreements/${agreementId}/versions`,
        );
        setVersions(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load versions.");
      } finally {
        setLoading(false);
      }
    }

    if (agreementId) load();
  }, [agreementId]);

  return { versions, loading, error };
}
