"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const VOORBEELD_LEAD = `Van: Testklant <testklant@voorbeeld.nl>
Onderwerp: Vraag via AutoScout24

Hoi, ik zag jullie BMW 3-Serie 320i Touring (kenteken K-123-XZ) staan voor € 24.950.
Is deze auto nog beschikbaar en kan ik een proefrit inplannen?

Groet,
Testklant
06-12345678`;

export function InboundAddress({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <code style={{ fontSize: 13.5, color: "var(--ink)", background: "var(--code-bg)", borderRadius: 10, padding: "10px 14px" }}>
        {address}
      </code>
      <button
        type="button"
        className="btn ghost small"
        onClick={async () => {
          await navigator.clipboard.writeText(address).catch(() => {});
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? "✓ Gekopieerd" : "Kopieer"}
      </button>
    </div>
  );
}

const STAPPEN = [
  "Lead ontvangen via AutoScout24",
  "Klant, auto en vraag uitgelezen",
  "Kenteken gecheckt bij de RDW",
  "Lead gescoord: heet, warm of koud",
  "Persoonlijk antwoord geschreven",
];

export function TestLeadButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");

  async function run() {
    setBusy(true);
    setError("");
    setStep(0);
    const started = Date.now();
    const ticker = setInterval(() => setStep((s) => Math.min(s + 1, STAPPEN.length - 1)), 1400);
    try {
      const res = await fetch("/api/test-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw: VOORBEELD_LEAD }),
      });
      if (!res.ok) throw new Error();
      const { id } = (await res.json()) as { id: number };
      clearInterval(ticker);
      setStep(STAPPEN.length);
      const secs = Math.max(1, Math.round((Date.now() - started) / 1000));
      await new Promise((r) => setTimeout(r, 600));
      router.push(`/leads/${id}?nieuw=1&t=${secs}`);
    } catch {
      clearInterval(ticker);
      setBusy(false);
      setError("Kon geen voorbeeldlead versturen. Probeer het zo nog eens.");
    }
  }

  return (
    <>
      <button type="button" className={compact ? "btn ghost small" : "btn small"} disabled={busy} onClick={run}>
        {busy ? "RepRight is bezig…" : "▶ Probeer met een voorbeeldlead"}
      </button>
      {error && <span className="note" style={{ color: "var(--red-ink)" }}>{error}</span>}
      {busy && (
        <div className="proc-overlay" role="status" aria-live="polite">
          <div className="proc">
            <span className="app-live"><i />RepRight werkt</span>
            <b>Een nieuwe lead komt binnen…</b>
            <ul>
              {STAPPEN.map((s, i) => (
                <li key={s} className={i < step ? "done" : i === step ? "now" : ""}>
                  <span className="dot">{i < step ? "✓" : ""}</span>{s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
