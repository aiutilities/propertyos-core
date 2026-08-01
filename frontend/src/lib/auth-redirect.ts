const RETURN_TO_KEY =
  "propertyos.auth.return-to";
const LOGIN_MESSAGE_KEY =
  "propertyos.auth.login-message";

const DEFAULT_RETURN_TO = "/dashboard";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function isSafeInternalPath(
  value: string | null,
): value is string {
  return Boolean(
    value &&
      value.startsWith("/") &&
      !value.startsWith("//") &&
      !value.includes("://") &&
      !value.startsWith("/login"),
  );
}

export function rememberPostLoginPath(
  path?: string,
): void {
  if (!isBrowser()) {
    return;
  }

  const candidate =
    path ??
    `${window.location.pathname}${window.location.search}`;

  if (!isSafeInternalPath(candidate)) {
    return;
  }

  window.sessionStorage.setItem(
    RETURN_TO_KEY,
    candidate,
  );
}

export function getPostLoginPath(): string {
  if (!isBrowser()) {
    return DEFAULT_RETURN_TO;
  }

  const stored =
    window.sessionStorage.getItem(RETURN_TO_KEY);

  return isSafeInternalPath(stored)
    ? stored
    : DEFAULT_RETURN_TO;
}

export function clearPostLoginPath(): void {
  if (!isBrowser()) {
    return;
  }

  window.sessionStorage.removeItem(RETURN_TO_KEY);
}

export function setLoginMessage(
  message: string,
): void {
  if (!isBrowser() || !message.trim()) {
    return;
  }

  window.sessionStorage.setItem(
    LOGIN_MESSAGE_KEY,
    message.trim(),
  );
}

export function consumeLoginMessage(): string {
  if (!isBrowser()) {
    return "";
  }

  const message =
    window.sessionStorage.getItem(LOGIN_MESSAGE_KEY) ??
    "";

  window.sessionStorage.removeItem(LOGIN_MESSAGE_KEY);

  return message;
}
