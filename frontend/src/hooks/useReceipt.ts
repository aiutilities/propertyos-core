"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { Receipt } from "@/types/receipt";

export function useReceipt(id: string) {
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");

        const response = await apiRequest<Receipt>(`/receipts/${id}`);
        setReceipt(response);
      } catch (err) {
        setReceipt(null);
        setError(
          err instanceof Error ? err.message : "Unable to load receipt.",
        );
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      load();
    } else {
      setReceipt(null);
      setLoading(false);
      setError("Receipt ID is required.");
    }
  }, [id]);

  return { receipt, loading, error };
}
