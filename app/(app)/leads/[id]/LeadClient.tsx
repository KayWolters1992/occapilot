"use client";

import { useEffect, useState } from "react";
import { replyToLead } from "../../../actions";

const SNEL = [
  "Ik bel je vandaag nog even om het door te nemen.",
  "Goed bod, ik kijk wat ik kan doen en laat het je vandaag weten.",
  "Neem gerust je huidige auto mee, dan taxeren we hem ter plekke.",
];

/** Antwoordvak onder het gesprek: de verkoper neemt het over. */
export function ReplyBox({ leadId, sellerName, escalated }: { leadId: number; sellerName: string; escalated: boolean }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form action={replyToLead} className="replybox" onSubmit={() => setBusy(true)}>
      <input type="hidden" name="id" value={leadId} />
      <div className="replybox-head">
        <b>{escalated ? "Neem het gesprek over" : "Zelf reageren"}</b>
        <span>Je bericht gaat vanaf jouw adres naar de klant, in hetzelfde gesprek.</span>
      </div>
      <div className="replybox-chips">
        {SNEL.map((s) => (
          <button type="button" key={s} className="chip" onClick={() => setText(s)}>{s}</button>
        ))}
      </div>
      <textarea
        name="text"
        rows={4}
        required
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={`Typ je bericht aan de klant… (ondertekend als ${sellerName})`}
      />
      <div className="replybox-foot">
        <label className="check">
          <input type="checkbox" name="handback" value="1" defaultChecked={!escalated} />
          <span>Laat Occapilot daarna weer opvolgen</span>
        </label>
        <button className="btn" disabled={busy}>{busy ? "Versturen…" : `Verstuur als ${sellerName} →`}</button>
      </div>
    </form>
  );
}

/** Typt een bericht uit, voor het demo-moment direct na een nieuwe lead. */
export function TypedText({ text }: { text: string }) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      i += 2;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(t);
    }, 24);
    return () => clearInterval(t);
  }, [text]);
  return (
    <>
      {shown}
      {shown.length < text.length && <i className="x-caret" />}
    </>
  );
}
