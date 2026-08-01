# Session Lifecycle

```text
Login
  ↓
Session Created
  ↓
Protected Navigation
  ↓
Authenticated API Request
  ↓
401 Invalid or Expired Token
  ↓
Clear Session
  ↓
Publish Session-Expired Event
  ↓
Hide Protected Content
  ↓
Redirect to Login
```

## Browser Keys

- `propertyos.auth.token`
- `propertyos.auth.user`

## Shared Event

```ts
type SessionExpiredDetail = {
  reason: "invalid" | "expired";
  message: string;
  requestId?: string;
};
```

Event name: `propertyos:session-expired`

## Rules

- Concurrent 401 responses must not cause repeated redirects.
- `ProtectedRoute` listens for the shared event.
- Login requests with `auth: false` do not trigger expiry.
- Tokens, passwords and authorization headers are never logged.
