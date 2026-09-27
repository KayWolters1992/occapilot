"use client";

import { useActionState } from "react";
import { login } from "../actions";
import { Logo } from "@/components/Logo";

export default function LoginPage() {
  const [state, action, pending] = useActionState<{ error?: string }, FormData>(login, {});
  return (
    <main className="loginwrap">
      <div className="login">
        <Logo markSize={32} wordHeight={18} />
        <p style={{ margin: 0, fontSize: 13.5, color: "var(--muted)" }}>Log in op het dealerdashboard.</p>
        {state?.error && <div className="err">{state.error}</div>}
        <form action={action} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="field">
            <label htmlFor="email">E-mailadres</label>
            <input id="email" name="email" type="email" autoComplete="username" required />
          </div>
          <div className="field">
            <label htmlFor="password">Wachtwoord</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          <button className="btn" disabled={pending}>{pending ? "Bezig…" : "Inloggen"}</button>
        </form>
        <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", textAlign: "center" }}>
          Nog geen account? <a href="/registreren">Gratis aanmelden</a>
        </p>
      </div>
    </main>
  );
}
