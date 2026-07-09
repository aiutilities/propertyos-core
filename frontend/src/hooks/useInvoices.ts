"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { Invoice, InvoiceListResponse } from "@/types/invoice";

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await apiRequest<InvoiceListResponse>("/invoices");
        setInvoices(response.data.invoices);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load invoices.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return { invoices, loading, error };
}
