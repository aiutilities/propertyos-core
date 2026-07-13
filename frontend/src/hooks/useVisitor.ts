"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type {
  Visit,
  VisitResponse,
  VisitorHistoryEntry,
  VisitorHistoryResponse,
} from "@/types/visitor";

export function useVisitor(visitId: string) {
  const [visit, setVisit] = useState<Visit | null>(null);
  const [history, setHistory] = useState<VisitorHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [visitResponse, historyResponse] = await Promise.all([
        apiRequest<VisitResponse>(`/plugins/visitor/${visitId}`),
        apiRequest<VisitorHistoryResponse>(
          `/plugins/visitor/${visitId}/history`,
        ),
      ]);

      setVisit(visitResponse.data);
      setHistory(historyResponse.data.items);
    } catch (err) {
      setVisit(null);
      setHistory([]);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load visitor details.",
      );
    } finally {
      setLoading(false);
    }
  }, [visitId]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    visit,
    history,
    loading,
    error,
    refresh: load,
  };
}
