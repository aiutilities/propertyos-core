# API Error Model

## Core Type

```ts
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly technicalMessage: string;
  readonly requestId?: string;
  readonly path?: string;
  readonly details?: unknown;
  readonly authenticationFailure: boolean;
  readonly retryable: boolean;
}
```

## Classification

| Status | Classification | Default message |
|---:|---|---|
| 400 | Bad request | The request could not be completed. |
| 401 | Authentication failure | Your session has expired. Please sign in again. |
| 403 | Authorization failure | You do not have permission to perform this action. |
| 404 | Not found | The requested record could not be found. |
| 409 | Conflict | The record has changed. Refresh and try again. |
| 422 | Validation failure | Use a safe backend validation message when available. |
| 429 | Rate limited | Too many requests. Please try again shortly. |
| 500–599 | Server failure | PropertyOS could not complete the request. Please try again. |
| 0 | Network failure | PropertyOS could not connect to the server. |

## Rules

- Raw response bodies must never become user-facing messages.
- Login 401 responses must not trigger session expiry.
- Authenticated 401 responses must invalidate the current session.
- `downloadApiFile()` must use the same parser and session behavior.
