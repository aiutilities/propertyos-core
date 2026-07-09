"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { Space, SpaceResponse } from "@/types/space";

export function useSpaces(propertyId: string) {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await apiRequest<SpaceResponse>(
          `/properties/${propertyId}/spaces`,
        );
        setSpaces(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load spaces.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [propertyId]);

  return { spaces, loading, error };
}
