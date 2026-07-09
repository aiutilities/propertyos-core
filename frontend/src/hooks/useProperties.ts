"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { Property, PropertyListResponse } from "@/types/property";

export function useProperties() {
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const response =
          await apiRequest<PropertyListResponse>("/properties");
        setItems(response.data.items);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return { items, loading };
}
