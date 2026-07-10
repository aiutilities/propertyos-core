"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { Zone, ZoneResponse } from "@/types/zone";

export function useZones(propertyId: string) {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await apiRequest<ZoneResponse>(
          `/properties/${propertyId}/zones`,
        );
        setZones(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load zones.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [propertyId]);

  return { zones, loading, error };
}
