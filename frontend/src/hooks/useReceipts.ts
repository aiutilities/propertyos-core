"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { Receipt } from "@/types/receipt";

export function useReceipts() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await apiRequest<Receipt[]>("/receipts");
        setReceipts(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load receipts.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return { receipts, loading, error };
}
