import type { AuthUser } from "@/types/auth";

const TOKEN_KEY = "propertyos.auth.token";
const USER_KEY = "propertyos.auth.user";

export function getToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(TOKEN_KEY);
}

export function setSession(token: string, user?: AuthUser): void {
  window.localStorage.setItem(TOKEN_KEY, token);

  if (user) {
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function getSessionUser(): AuthUser | null {
  if (typeof window === "undefined") {
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
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export function isAuthenticated(): boolean {
  return Boolean(getToken());
}
