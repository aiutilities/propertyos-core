import type { ApiError } from "./api-error";
import { invalidateSession } from "./session";

export function handleApiAuthenticationFailure(
  error: ApiError,
): boolean {
  if (!error.authenticationFailure) {
    return false;
  }

  return invalidateSession({
    reason:
      error.code === "TOKEN_EXPIRED"
        ? "expired"
        : "invalid",
    message: error.message,
    requestId: error.requestId,
  });
}
