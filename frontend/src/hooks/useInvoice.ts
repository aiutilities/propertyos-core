"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { Invoice } from "@/types/invoice";

export interface InvoiceResponse {
  success: boolean;
  data: {
    invoice: Invoice;
  };
}

export function useInvoice(id: string) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await apiRequest<InvoiceResponse>(`/invoices/${id}`);
        setInvoice(response.data.invoice);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load invoice.");
      } finally {
        setLoading(false);
      }
    }

    if (id) load();
  }, [id]);

  return { invoice, loading, error };
}
