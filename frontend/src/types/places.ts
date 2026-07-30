export type PlacesPayload =
  Record<string, unknown>;

export type PlacesResult =
  | Record<string, unknown>
  | unknown[]
  | string
  | number
  | boolean
  | null;

export interface PlacesHealth {
  status?: string;
  healthy?: boolean;
  available?: boolean;
  provider?: string;
  providers?: Record<string, unknown>;
  [key: string]: unknown;
}

export const PLACES_ROUTES = {
  search: {
    method: "GET",
    path: "/places/search",
  },
  nearby: {
    method: "POST",
    path: "/places/nearby",
  },
  details: {
    method: "GET",
    path: "/places/details",
  },
  health: {
    method: "GET",
    path: "/places/health",
  },
} as const;
