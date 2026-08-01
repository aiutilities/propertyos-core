"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";
import {
  clearPostLoginPath,
  consumeLoginMessage,
  getPostLoginPath,
} from "@/lib/auth-redirect";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setNotice(consumeLoginMessage());
  }, []);

  async function onSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    try {
      await login({ email, password });

      const destination = getPostLoginPath();
      clearPostLoginPath();
      router.replace(destination);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      className="auth-card"
      onSubmit={onSubmit}
    >
      <div>
        <p className="eyebrow">
          PropertyOS Admin
        </p>

        <h1>Sign in</h1>

        <p className="muted">
          Access the admin console for properties,
          plugins, workflows and operations.
        </p>
      </div>

      {notice ? (
        <p
          className="auth-notice"
          role="status"
        >
          {notice}
        </p>
      ) : null}

      <label>
        Email
        <input
          value={email}
          onChange={(event) =>
            setEmail(event.target.value)
          }
          type="email"
          autoComplete="email"
          required
        />
      </label>

      <label>
        Password
        <input
          value={password}
          onChange={(event) =>
            setPassword(event.target.value)
          }
          type="password"
          autoComplete="current-password"
          required
        />
      </label>

      {error ? (
        <p
          className="error"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
