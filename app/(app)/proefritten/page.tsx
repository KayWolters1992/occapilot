import Link from "next/link";
import { db } from "@/lib/db";
import { currentDealer } from "@/lib/auth";
import type { Lead } from "@/lib/types";
import { Plate } from "@/components/LeadBits";
import { closeLead } from "../../actions";
import { AfspraakKnop } from "@/components/AfspraakKnop";
import { parseSchedule, nextSlots, tijdMs, nuLokaal, dagWoord, botsing, afspraakLabel } from "@/lib/schedule";
import { bezetteTijdenMetNaam } from "@/lib/afspraken";

export const dynamic = "force-dynamic";

const DAG = ["zo", "ma", "di", "wo", "do", "vr", "za"];
const MAAND = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

export default async function Proefritten({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const dealer = (await currentDealer())!;
  const sp = await searchParams;
  const schedule = parseSchedule(dealer.schedule_json);
  const rows = db()
    .prepare("SELECT * FROM leads WHERE dealer_id=? AND status='afspraak'")
    .all(dealer.id) as Lead[];

  const nu = tijdMs(nuLokaal());
  const metTijd = rows.filter((l) => l.afspraak_tijd).sort((a, b) => a.afspraak_tijd!.localeCompare(b.afspraak_tijd!));
  const zonderTijd = rows.filter((l) => !l.afspraak_tijd);
  const komend = metTijd.filter((l) => tijdMs(l.afspraak_tijd!) >= nu - 2 * 3600_000);
  const verlopen = metTijd.filter((l) => tijdMs(l.afspraak_tijd!) < nu - 2 * 3600_000);

  const groepen: { titel: string; items: Lead[]; cls?: string }[] = [];
  const vandaag = komend.filter((l) => dagWoord(l.afspraak_tijd!) === "Vandaag");
  const morgen = komend.filter((l) => dagWoord(l.afspraak_tijd!) === "Morgen");
  const later = komend.filter((l) => !dagWoord(l.afspraak_tijd!));
  if (verlopen.length) groepen.push({ titel: "Geweest? Rond even af", items: verlopen, cls: "oud" });
  if (vandaag.length) groepen.push({ titel: "Vandaag", items: vandaag, cls: "nu" });
  if (morgen.length) groepen.push({ titel: "Morgen", items: morgen });
  if (later.length) groepen.push({ titel: "Later", items: later });
  if (zonderTijd.length) groepen.push({ titel: "Tijd nog onbekend", items: zonderTijd, cls: "oud" });

  const kaart = (l: Lead) => {
    const t = l.afspraak_tijd || "";
    const ms = t ? tijdMs(t) : NaN;
    const d = Number.isNaN(ms) ? null : new Date(ms);
    const bezet = bezetteTijdenMetNaam(dealer.id, l.id);
    const botst = t ? botsing(t, bezet.map((b) => b.tijd), schedule.duur) : null;
    const isOud = t && ms < nu - 2 * 3600_000;
    return (
      <div key={l.id} className={`rit ${isOud ? "oud" : ""}`}>
        <div className="rit-date">
          {d ? (
            <>
              <span className="rit-dag">{DAG[d.getUTCDay()]} {d.getUTCDate()} {MAAND[d.getUTCMonth()]}</span>
              <span className="rit-tijd">{t.slice(11, 16)}</span>
            </>
          ) : (
            <span className="rit-tijd">?</span>
          )}
        </div>
        <div className="rit-body">
          <div className="rit-top">
            <b>{l.customer_name || "Onbekend"}</b>
            <Plate p={l.license_plate} />
          </div>
          <span className="rit-car">{l.vehicle || "Onbekende auto"}{l.price ? ` · ${l.price}` : ""}{l.customer_phone ? ` · ${l.customer_phone}` : ""}</span>
          <div className="rit-tags">
            {t && !isOud && <span className={`rit-tag ${l.afspraak_herinnerd ? "ok" : ""}`}>{l.afspraak_herinnerd ? "✓ Herinnering verstuurd" : "🔔 Klant krijgt een dag van tevoren een herinnering"}</span>}
            {!t && <span className="rit-tag warn">Leg de tijd vast, dan krijgt de klant ook een herinnering</span>}
            {botst && <span className="rit-tag warn">⚠️ Overlapt met {bezet.find((b) => b.tijd === botst)?.naam} ({afspraakLabel(botst).split(" om ")[1]})</span>}
          </div>
        </div>
        <div className="rit-actions">
          {l.customer_phone && <a className="btn small" href={`tel:${l.customer_phone.replace(/\s/g, "")}`}>📞 Bel</a>}
          <AfspraakKnop
            leadId={l.id}
            klant={l.customer_name || "de klant"}
            huidig={t}
            voorstel={nextSlots(schedule, 1, new Date(), bezet.map((b) => b.tijd))[0]?.tijd ?? ""}
            bezet={bezet}
            schedule={schedule}
            heeftEmail={!!l.customer_email}
            label={t ? "🔁 Verzetten" : "🗓️ Tijd vastleggen"}
            className="btn ghost small"
            terug="proefritten"
          />
          <div className="rit-mini">
            <Link href={`/leads/${l.id}`}>Gesprek</Link>
            <form action={closeLead}>
              <input type="hidden" name="id" value={l.id} />
              <button name="status" value="gesloten">✓ Geweest</button>
            </form>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="pagehead">
        <div className="titles">
          <h1>Proefritten <em>gepland</em></h1>
          <span className="subtitle">Je agenda met proefritten. De klant krijgt een dag van tevoren automatisch een herinnering. Jij zet de auto klaar.</span>
        </div>
        <Link href="/instellingen#rooster" className="btn ghost small">🗓️ Proefrittijden aanpassen</Link>
      </div>

      {sp.ok && (
        <div className="demobar ok">
          <span className="demobar-ic">✓</span>
          <div><b>Proefrit {sp.ok === "verzet" ? "verzet" : "vastgelegd"}.</b><span>De agenda hieronder is bijgewerkt.</span></div>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="card">
          <div className="empty big">
            <span className="empty-ic">📅</span>
            <b>Nog geen proefritten gepland</b>
            <span>Kiest een klant een moment, dan zet RepRight het hier neer en krijg jij een melding. Heb je zelf telefonisch iets afgesproken? Open de lead en klik op &quot;Afspraak gemaakt&quot;.</span>
            <Link href="/leads?bak=ai" className="start-link">Bekijk de leads waar RepRight mee bezig is →</Link>
          </div>
        </div>
      ) : (
        groepen.map((g) => (
          <section key={g.titel} className={`rit-groep ${g.cls ?? ""}`}>
            <h2>{g.titel} <span>{g.items.length}</span></h2>
            <div className="ritten">{g.items.map(kaart)}</div>
          </section>
        ))
      )}
    </>
  );
}
