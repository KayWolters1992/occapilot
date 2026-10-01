"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { planAfspraak } from "../../app/actions";
import { afspraakLabel, binnenRooster, botsing, type Schedule } from "@/lib/schedule";

type Bezet = { tijd: string; naam: string };

/** Knop + venster om een proefrit vast te leggen of te verzetten. */
export function AfspraakKnop({
  leadId, klant, huidig, voorstel, bezet, schedule, heeftEmail, label = "📅 Afspraak gemaakt", className = "btn small", terug = "",
}: {
  leadId: number; klant: string; huidig: string; voorstel: string; bezet: Bezet[]; schedule: Schedule;
  heeftEmail: boolean; label?: string; className?: string; terug?: string;
}) {
  const start = huidig || voorstel;
  const [open, setOpen] = useState(false);
  const [datum, setDatum] = useState(start.slice(0, 10));
  const [tijd, setTijd] = useState(start.slice(11, 16) || "10:00");
  const [bevestig, setBevestig] = useState(heeftEmail);
  const [bezig, setBezig] = useState(false);

  const gekozen = datum && tijd ? `${datum} ${tijd}` : "";
  const botst = gekozen ? botsing(gekozen, bezet.map((b) => b.tijd), schedule.duur) : null;
  const botsNaam = botst ? bezet.find((b) => b.tijd === botst)?.naam : "";
  const buiten = gekozen ? !binnenRooster(schedule, gekozen) : false;

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>{label}</button>
      {open && typeof document !== "undefined" && createPortal(
        <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <form className="modal" action={planAfspraak} onSubmit={() => setBezig(true)}>
            <button type="button" className="modal-x" aria-label="Sluiten" onClick={() => setOpen(false)}>✕</button>
            <span className="modal-ic">📅</span>
            <b className="modal-t">{huidig ? "Proefrit verzetten" : "Proefrit vastleggen"}</b>
            <span className="modal-s">
              Met {klant}. RepRight stopt met opvolgen, zet de afspraak bij Proefritten en stuurt de klant een dag van tevoren een herinnering.
            </span>
            <input type="hidden" name="id" value={leadId} />
            <input type="hidden" name="terug" value={terug} />
            <div className="modal-row">
              <label>Datum<input type="date" name="datum" required value={datum} onChange={(e) => setDatum(e.target.value)} /></label>
              <label>Tijd<input type="time" name="tijd" required step={300} value={tijd} onChange={(e) => setTijd(e.target.value)} /></label>
            </div>
            {gekozen && <div className="modal-sum">🗓️ {afspraakLabel(gekozen)}</div>}
            {botst && <div className="modal-warn">⚠️ Let op: om {botst.slice(11)} staat al een proefrit{botsNaam ? ` met ${botsNaam}` : ""}.</div>}
            {!botst && buiten && <div className="modal-warn soft">Dit valt buiten je proefritrooster. Dat mag, als je het zo met de klant hebt afgesproken.</div>}
            <label className="check-row">
              <input type="checkbox" name="bevestig" checked={bevestig} disabled={!heeftEmail} onChange={(e) => setBevestig(e.target.checked)} />
              <span>
                <b>Stuur de klant een bevestiging per mail</b>
                <small>{heeftEmail ? "Een korte mail met dag, tijd en adres, uit jouw naam." : "Deze klant heeft geen e-mailadres. Bevestig het telefonisch."}</small>
              </span>
            </label>
            <div className="modal-actions">
              <button type="button" className="btn ghost small" onClick={() => setOpen(false)}>Annuleren</button>
              <button className="btn small" disabled={bezig}>{bezig ? "Bezig…" : huidig ? "Verzetten" : "Vastleggen"}</button>
            </div>
          </form>
        </div>,
        document.body
      )}
    </>
  );
}
