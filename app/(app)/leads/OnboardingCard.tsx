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
      <code style={{ fontSize: 13.5, color: "var(--ink)", background: "#f1f3fa", borderRadius: 10, padding: "10px 14px" }}>
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

export function TestLeadButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start" }}>
      <button
        type="button"
        className="btn small"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const res = await fetch("/api/test-lead", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ raw: VOORBEELD_LEAD }),
            });
            if (!res.ok) throw new Error();
            router.refresh();
          } catch {
            setError("Kon geen voorbeeldlead versturen — probeer het zo nog eens.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Bezig…" : "▶ Stuur een voorbeeldlead"}
      </button>
      {error && <span className="note" style={{ color: "var(--red-ink)" }}>{error}</span>}
    </div>
  );
}
