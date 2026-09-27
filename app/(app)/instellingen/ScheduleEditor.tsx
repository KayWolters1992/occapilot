"use client";

import { useEffect, useMemo, useState } from "react";
import { DAGEN, nextSlots, scheduleSummary, type Schedule } from "@/lib/schedule";
import { updateSchedule } from "../../actions";

const TIJDEN: string[] = [];
for (let h = 6; h <= 22; h++) for (const m of ["00", "30"]) TIJDEN.push(`${String(h).padStart(2, "0")}:${m}`);

export function ScheduleEditor({ initial }: { initial: Schedule }) {
  const [s, setS] = useState<Schedule>(initial);
  const [busy, setBusy] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const preview = useMemo(() => (mounted ? nextSlots(s, 6) : []), [s, mounted]);

  const setDay = (i: number, patch: Partial<Schedule["days"][number]>) =>
    setS((cur) => ({ ...cur, days: cur.days.map((d, j) => (j === i ? { ...d, ...patch } : d)) }));

  const copyWeekdays = () =>
    setS((cur) => ({ ...cur, days: cur.days.map((d, j) => (j >= 1 && j <= 4 ? { ...cur.days[0] } : d)) }));

  return (
    <form action={updateSchedule} className="rooster" onSubmit={() => setBusy(true)}>
      <input type="hidden" name="schedule_json" value={JSON.stringify(s)} />

      <div className="rooster-grid">
        <div className="rooster-days">
          <div className="rooster-sub">
            <b>Weekrooster</b>
            <button type="button" className="chip" onClick={copyWeekdays}>Maandag → alle werkdagen</button>
          </div>
          {s.days.map((d, i) => (
            <div key={DAGEN[i]} className={`rday ${d.open ? "" : "closed"}`}>
              <label className="switch">
                <input type="checkbox" checked={d.open} onChange={(e) => setDay(i, { open: e.target.checked })} />
                <span className="track"><i /></span>
                <span className="rday-name">{DAGEN[i]}</span>
              </label>
              {d.open ? (
                <div className="rday-times">
                  <select value={d.van} onChange={(e) => setDay(i, { van: e.target.value })} aria-label={`${DAGEN[i]} vanaf`}>
                    {TIJDEN.map((t) => <option key={t} value={t}>{t.replace(":", ".")}</option>)}
                  </select>
                  <span>tot</span>
                  <select value={d.tot} onChange={(e) => setDay(i, { tot: e.target.value })} aria-label={`${DAGEN[i]} tot`}>
                    {TIJDEN.map((t) => <option key={t} value={t}>{t.replace(":", ".")}</option>)}
                  </select>
                </div>
              ) : (
                <span className="rday-off">Geen proefritten</span>
              )}
            </div>
          ))}
        </div>

        <div className="rooster-side">
          <div className="field">
            <label>Hoe lang duurt een proefrit?</label>
            <div className="seg">
              {[30, 45, 60, 90].map((m) => (
                <button type="button" key={m} className={s.duur === m ? "on" : ""} onClick={() => setS({ ...s, duur: m })}>{m} min</button>
              ))}
            </div>
          </div>
          <div className="field">
            <label>Hoe snel na de aanvraag mag de proefrit zijn?</label>
            <div className="seg">
              {[{ v: 2, t: "na 2 uur" }, { v: 4, t: "na 4 uur" }, { v: 24, t: "vanaf morgen" }].map((o) => (
                <button type="button" key={o.v} className={s.vooraf === o.v ? "on" : ""} onClick={() => setS({ ...s, vooraf: o.v })}>{o.t}</button>
              ))}
            </div>
          </div>
          <div className="field">
            <label htmlFor="gesloten">Vrije dagen of uitzonderingen</label>
            <textarea id="gesloten" rows={2} value={s.gesloten} onChange={(e) => setS({ ...s, gesloten: e.target.value })}
              placeholder="Bijv. gesloten op 2e kerstdag en 1 januari; 14 t/m 18 oktober alleen op afspraak" />
          </div>
          <div className="field">
            <label htmlFor="notitie">Wat moet de klant meenemen of weten?</label>
            <textarea id="notitie" rows={2} value={s.notitie} onChange={(e) => setS({ ...s, notitie: e.target.value })}
              placeholder="Bijv. neem je rijbewijs mee. Parkeren kan voor de deur." />
          </div>

          <div className="rooster-preview">
            <span className="app-live"><i />Voorbeeld</span>
            <b>Zo stelt Occapilot nu momenten voor</b>
            <span className="note">{scheduleSummary(s)} · proefrit {s.duur} min</span>
            <div className="slots">
              {preview.length ? preview.map((m) => <span key={m.label} className="slot">{m.label}</span>) : <span className="note">Geen vrije momenten. Zet minstens één dag open.</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="rooster-foot">
        <span className="note">Occapilot stelt altijd twee momenten voor, bij voorkeur één ochtend en één middag.</span>
        <button className="btn" disabled={busy}>{busy ? "Opslaan…" : "Rooster opslaan"}</button>
      </div>
    </form>
  );
}
