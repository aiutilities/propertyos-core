import { apiRequest } from "@/lib/api";
import { setSession } from "@/lib/session";
import type { LoginRequest, LoginResponse } from "@/types/auth";

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const result = await apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    auth: false,
    body: JSON.stringify(payload),
  });

  const token = result.accessToken ?? result.token;

  if (!token) {
    throw new Error("Login succeeded but no token was returned.");
  }

  setSession(token, result.user ?? { email: payload.email });

  return result;
}
