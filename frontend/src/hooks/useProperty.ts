"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { Property } from "@/types/property";

type PropertyResponse = {
  success: boolean;
  data: Property;
};

export function useProperty(id: string) {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const response =
          await apiRequest<PropertyResponse>(`/properties/${id}`);
        setProperty(response.data);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      load();
    }
  }, [id]);

  return { property, loading };
}
