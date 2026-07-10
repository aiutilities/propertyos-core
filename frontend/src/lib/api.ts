import { getToken } from "@/lib/session";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

type ApiOptions = RequestInit & {
  auth?: boolean;
};

export async function apiRequest<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (options.auth !== false) {
    const token = getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}


export async function downloadApiFile(
  path: string,
  fallbackFilename: string,
): Promise<void> {
  const headers = new Headers();
  const token = getToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      message || `Download failed with ${response.status}`,
    );
  }

  const disposition =
    response.headers.get("Content-Disposition") ?? "";

  const filenameMatch = disposition.match(
    /filename="?([^";]+)"?/i,
  );

  const filename =
    filenameMatch?.[1] ?? fallbackFilename;

  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(objectUrl);
}
