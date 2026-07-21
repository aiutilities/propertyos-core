export type AiProviderHttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE';

export interface AiProviderHttpRequest {
  providerName: string;
  url: string;
  method: AiProviderHttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs: number;
}

export interface AiProviderHttpResponse<T = unknown> {
  providerName: string;
  status: number;
  ok: boolean;
  headers: Record<string, string>;
  data: T;
  durationMs: number;
}

export type AiProviderHttpTransportFailureCode =
  | 'INVALID_REQUEST'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'HTTP_STATUS_ERROR'
  | 'INVALID_JSON_RESPONSE';

export interface AiProviderHttpTransportFailureDetails {
  providerName: string;
  code: AiProviderHttpTransportFailureCode;
  retriable: boolean;
  status?: number;
  timeoutMs?: number;
}
