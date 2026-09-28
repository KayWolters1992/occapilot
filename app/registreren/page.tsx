"use client";

import Link from "next/link";
import { useActionState } from "react";
import { register } from "../actions";
import { Logo } from "@/components/Logo";

const PERKS = [
  { ic: "⚡", t: "Live binnen één middag", s: "Eén doorstuurregel instellen en RepRight beantwoordt vanaf dat moment elke lead." },
  { ic: "🌙", t: "Nooit meer een gemiste lead", s: "24/7, ook om 23:00 en op zondag. Precies wanneer de concurrentie slaapt." },
  { ic: "🛡️", t: "Veilig en onder controle", s: "Harde vangrails, volledige logging, jij houdt altijd de regie." },
];

export default function RegisterPage() {
  const [state, action, pending] = useActionState<{ error?: string }, FormData>(register, {});
  return (
    <main className="authwrap">
      <div className="authpanel">
        <Logo onDark markSize={38} wordHeight={20} />
        <div className="authwelcome">
          <span className="lp-badge">🎉 Welkom bij RepRight AI</span>
          <h1>Fijn dat je er bent.</h1>
          <p>Je bent 2 minuten verwijderd van een verkoopteam dat nooit slaapt, nooit vergeet en nooit een lead laat liggen.</p>
        </div>
        <div className="authperks">
          {PERKS.map((p) => (
            <div className="authperk" key={p.t}>
              <span className="ic">{p.ic}</span>
              <div>
                <b>{p.t}</b>
                <span>{p.s}</span>
              </div>
            </div>
          ))}
        </div>
        <span className="lp-note" style={{ color: "#8a93c4" }}>14 dagen gratis · geen creditcard nodig · maandelijks opzegbaar</span>
      </div>

      <div className="authformwrap">
        <div className="login authcard" style={{ maxWidth: 440 }}>
          <div>
            <h2 style={{ margin: "0 0 4px" }}>Maak je gratis account</h2>
            <p style={{ margin: 0, fontSize: 13.5, color: "var(--muted)" }}>
              Binnen 2 minuten klaar. Geen creditcard nodig.
            </p>
          </div>
          {state?.error && <div className="err">{state.error}</div>}
          <form action={action} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="field">
              <label htmlFor="name">Bedrijfsnaam *</label>
              <input id="name" name="name" type="text" placeholder="Autobedrijf Wolters" required />
            </div>
            <div className="field">
              <label htmlFor="city">Plaats</label>
              <input id="city" name="city" type="text" placeholder="Maastricht" />
            </div>
            <div className="field">
              <label htmlFor="seller_name">Jouw naam *</label>
              <input id="seller_name" name="seller_name" type="text" placeholder="Kay Wolters" required />
            </div>
            <div className="field">
              <label htmlFor="email">E-mailadres *</label>
              <input id="email" name="email" type="email" autoComplete="username" required />
            </div>
            <div className="field">
              <label htmlFor="password">Wachtwoord *</label>
              <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
              <span className="note">Minstens 8 tekens.</span>
            </div>
            <button className="btn" disabled={pending}>{pending ? "Bezig…" : "Account aanmaken · gratis"}</button>
          </form>
          <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", textAlign: "center" }}>
            Heb je al een account? <Link href="/login">Log hier in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
