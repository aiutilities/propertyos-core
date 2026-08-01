import type { AuthUser } from "@/types/auth";

const TOKEN_KEY = "propertyos.auth.token";
const USER_KEY = "propertyos.auth.user";

export const SESSION_EXPIRED_EVENT =
  "propertyos:session-expired";

export type SessionExpiredReason =
  | "invalid"
  | "expired";

export type SessionExpiredDetail = {
  reason: SessionExpiredReason;
  message: string;
  requestId?: string;
};

let sessionExpiryPublished = false;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getToken(): string | null {
  if (!isBrowser()) {
    return null;
  }

  return window.localStorage.getItem(TOKEN_KEY);
}

export function setSession(
  token: string,
  user?: AuthUser,
): void {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(TOKEN_KEY, token);

  if (user) {
    window.localStorage.setItem(
      USER_KEY,
      JSON.stringify(user),
    );
  } else {
    window.localStorage.removeItem(USER_KEY);
  }

  sessionExpiryPublished = false;
}

export function getSessionUser(): AuthUser | null {
  if (!isBrowser()) {
    return null;
  }

  const raw = window.localStorage.getItem(USER_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export function isAuthenticated(): boolean {
  return Boolean(getToken());
}

export function publishSessionExpired(
  detail: SessionExpiredDetail,
): boolean {
  if (!isBrowser() || sessionExpiryPublished) {
    return false;
  }

  sessionExpiryPublished = true;

  window.dispatchEvent(
    new CustomEvent<SessionExpiredDetail>(
      SESSION_EXPIRED_EVENT,
      { detail },
    ),
  );

  return true;
}

export function invalidateSession(
  detail: SessionExpiredDetail,
): boolean {
  clearSession();
  return publishSessionExpired(detail);
}

export function resetSessionExpiryGuard(): void {
  sessionExpiryPublished = false;
}
