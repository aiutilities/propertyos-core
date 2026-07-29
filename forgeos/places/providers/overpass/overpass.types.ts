export interface OverpassConfigurationInput {
  endpoint?: string;
  timeoutMilliseconds?: number;
  queryTimeoutSeconds?: number;
  userAgent?: string;
}

export interface OverpassConfiguration {
  status: 'READY' | 'BLOCKED';
  endpoint: string;
  timeoutMilliseconds: number;
  queryTimeoutSeconds: number;
  userAgent: string;
  errors: readonly string[];
}

export interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;

  center?: {
    lat: number;
    lon: number;
  };

  tags?: Record<string, string>;
}

export interface OverpassResponse {
  version?: number;
  generator?: string;

  osm3s?: {
    timestamp_osm_base?: string;
    copyright?: string;
  };

  elements: readonly OverpassElement[];
}
