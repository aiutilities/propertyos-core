import { apiRequest } from "@/lib/api";
import { setSession } from "@/lib/session";
import type { LoginRequest, LoginResponse } from "@/types/auth";

export async function login(
  payload: LoginRequest,
): Promise<LoginResponse> {
  const result = await apiRequest<LoginResponse>(
    "/auth/login",
    {
      method: "POST",
      auth: false,
      body: JSON.stringify(payload),
    },
  );

  setSession(result.accessToken, {
    id: result.person.id,
    email: result.person.email,
    name: result.person.displayName,
  });

  return result;
}
