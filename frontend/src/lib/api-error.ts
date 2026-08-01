export type ApiErrorOptions = {
  status: number;
  code: string;
  message: string;
  technicalMessage?: string;
  requestId?: string;
  path?: string;
  details?: unknown;
  authenticationFailure?: boolean;
  retryable?: boolean;
  cause?: unknown;
};

type BackendErrorEnvelope = {
  error?: {
    code?: unknown;
    message?: unknown;
    details?: unknown;
  };
  requestId?: unknown;
  path?: unknown;
};

export type ApiErrorContext = {
  path?: string;
  authenticationRequest?: boolean;
};

const SAFE_BACKEND_MESSAGE_STATUSES = new Set([400, 409, 422]);

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly technicalMessage: string;
  readonly requestId?: string;
  readonly path?: string;
  readonly details?: unknown;
  readonly authenticationFailure: boolean;
  readonly retryable: boolean;

  constructor(options: ApiErrorOptions) {
    super(options.message, { cause: options.cause });
    this.name = "ApiError";
    this.status = options.status;
    this.code = options.code;
    this.technicalMessage = options.technicalMessage ?? options.message;
    this.requestId = options.requestId;
    this.path = options.path;
    this.details = options.details;
    this.authenticationFailure = options.authenticationFailure ?? false;
    this.retryable = options.retryable ?? false;
  }
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function isLikelyHtml(value: string): boolean {
  const text = value.trim().toLowerCase();
  return text.startsWith("<!doctype html") || text.startsWith("<html");
}

function parseEnvelope(raw: string): BackendErrorEnvelope | undefined {
  if (!raw.trim()) return undefined;

  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as BackendErrorEnvelope)
      : undefined;
  } catch {
    return undefined;
  }
}

function defaultCode(status: number): string {
  if (status === 400) return "BAD_REQUEST";
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "CONFLICT";
  if (status === 422) return "VALIDATION_ERROR";
  if (status === 429) return "RATE_LIMITED";
  if (status >= 500) return "SERVER_ERROR";
  return "UNKNOWN_ERROR";
}

function defaultMessage(status: number, authenticationRequest: boolean): string {
  if (status === 401 && authenticationRequest) return "Invalid email or password.";
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403) return "You do not have permission to perform this action.";
  if (status === 404) return "The requested record could not be found.";
  if (status === 409) return "This record has changed. Refresh and try again.";
  if (status === 422) return "Please review the information and try again.";
  if (status === 429) return "Too many requests. Please try again shortly.";
  if (status >= 500) return "PropertyOS could not complete the request. Please try again.";
  return "The request could not be completed. Please try again.";
}

function mayExposeBackendMessage(status: number, message?: string): message is string {
  if (!message || !SAFE_BACKEND_MESSAGE_STATUSES.has(status)) return false;
  if (message.length > 240 || isLikelyHtml(message)) return false;

  return ![
    /stack/i,
    /trace/i,
    /select\s+.+\s+from/i,
    /syntax error/i,
    /internal server error/i,
    /exception/i,
  ].some((pattern) => pattern.test(message));
}

export async function createApiError(
  response: Response,
  context: ApiErrorContext = {},
): Promise<ApiError> {
  let raw = "";

  try {
    raw = await response.text();
  } catch {
    raw = "";
  }

  const envelope = parseEnvelope(raw);
  const backendCode = asString(envelope?.error?.code);
  const backendMessage = asString(envelope?.error?.message);
  const authenticationRequest = context.authenticationRequest === true;
  const safeMessage = mayExposeBackendMessage(response.status, backendMessage)
    ? backendMessage
    : defaultMessage(response.status, authenticationRequest);

  return new ApiError({
    status: response.status,
    code: backendCode ?? defaultCode(response.status),
    message: safeMessage,
    technicalMessage:
      backendMessage ??
      (!isLikelyHtml(raw) ? asString(raw) : undefined) ??
      `Request failed with HTTP ${response.status}`,
    requestId:
      asString(envelope?.requestId) ??
      asString(response.headers.get("x-request-id")),
    path: asString(envelope?.path) ?? context.path,
    details: envelope?.error?.details,
    authenticationFailure: response.status === 401 && !authenticationRequest,
    retryable:
      response.status === 408 || response.status === 429 || response.status >= 500,
  });
}

export function createNetworkError(error: unknown, path?: string): ApiError {
  if (error instanceof DOMException && error.name === "AbortError") {
    return new ApiError({
      status: 0,
      code: "REQUEST_ABORTED",
      message: "The request was cancelled.",
      technicalMessage: error.message || "Request aborted",
      path,
      cause: error,
    });
  }

  return new ApiError({
    status: 0,
    code: "NETWORK_ERROR",
    message:
      "PropertyOS could not connect to the server. Check your connection and try again.",
    technicalMessage: error instanceof Error ? error.message : String(error),
    path,
    retryable: true,
    cause: error,
  });
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
