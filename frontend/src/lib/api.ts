import { createApiError, createNetworkError } from "@/lib/api-error";
import { getToken } from "@/lib/session";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

type ApiOptions = RequestInit & {
  auth?: boolean;
};

async function executeRequest(
  path: string,
  options: ApiOptions,
): Promise<Response> {
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (options.auth !== false) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  try {
    return await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch (error) {
    throw createNetworkError(error, path);
  }
}

export async function apiRequest<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const response = await executeRequest(path, options);

  if (!response.ok) {
    throw await createApiError(response, {
      path,
      authenticationRequest: options.auth === false,
    });
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function downloadApiFile(
  path: string,
  fallbackFilename: string,
): Promise<void> {
  const response = await executeRequest(path, {});

  if (!response.ok) {
    throw await createApiError(response, { path });
  }

  const disposition = response.headers.get("Content-Disposition") ?? "";
  const filenameMatch = disposition.match(/filename="?([^";]+)"?/i);
  const filename = filenameMatch?.[1] ?? fallbackFilename;
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
