"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: form.get("username"),
        password: form.get("password"),
      }),
    });

    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError("Credenciales incorrectas");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-4 text-4xl font-bold tracking-tight text-accent">
            TS3
          </div>
          <h1 className="text-xl font-semibold text-text-primary">
            Panel de Control
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            ts.tebimedia.com
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-border bg-bg-card p-6 shadow-xl"
        >
          <div className="mb-4">
            <label
              htmlFor="username"
              className="mb-1.5 block text-sm font-medium text-text-secondary"
            >
              Usuario
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              autoComplete="username"
              className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2.5 text-sm text-text-primary outline-none transition focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-text-secondary"
            >
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2.5 text-sm text-text-primary outline-none transition focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
