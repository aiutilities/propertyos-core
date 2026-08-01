"use client";

import {
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  rememberPostLoginPath,
  setLoginMessage,
} from "@/lib/auth-redirect";
import {
  isAuthenticated,
  SESSION_EXPIRED_EVENT,
  type SessionExpiredDetail,
} from "@/lib/session";

export function ProtectedRoute({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    function redirectToLogin(
      message?: string,
    ): void {
      setChecked(false);
      rememberPostLoginPath();

      if (message) {
        setLoginMessage(message);
      }

      router.replace("/login");
    }

    function onSessionExpired(
      event: Event,
    ): void {
      const detail = (
        event as CustomEvent<SessionExpiredDetail>
      ).detail;

      redirectToLogin(
        detail?.message ??
          "Your session has expired. Please sign in again.",
      );
    }

    window.addEventListener(
      SESSION_EXPIRED_EVENT,
      onSessionExpired,
    );

    if (!isAuthenticated()) {
      redirectToLogin();
    } else {
      setChecked(true);
    }

    return () => {
      window.removeEventListener(
        SESSION_EXPIRED_EVENT,
        onSessionExpired,
      );
    };
  }, [router]);

  if (!checked) {
    return (
      <main
        className="center-screen"
        aria-live="polite"
      >
        Checking session...
      </main>
    );
  }

  return children;
}
