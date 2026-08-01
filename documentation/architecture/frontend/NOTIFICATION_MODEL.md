# Notification Model

## Types

- **Success:** completed user action
- **Warning:** attention required
- **Error:** failure requiring action
- **Information:** neutral workflow update
- **Retry:** recoverable failure

## Rules

- Toasts do not replace field-level validation.
- Session expiry shows one message only.
- Error notifications use safe `ApiError` messages.
- Notifications never contain JSON, stack traces or secrets.
