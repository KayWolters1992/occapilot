import Link from "next/link";
import { db } from "@/lib/db";
import { currentDealer } from "@/lib/auth";
import type { Lead } from "@/lib/types";
import { statusInfo, LANES, type Lane } from "@/lib/status";
import { Plate, groet, wanneer } from "@/components/LeadBits";
import { InboundAddress, TestLeadButton } from "../leads/OnboardingCard";
import { CountUp } from "../../_lp/Interactive";

export const dynamic = "force-dynamic";

type Activiteit = { id: number; lead_id: number; direction: string; subject: string; meta: string; created_at: string; customer_name: string; vehicle: string };

function activiteitTekst(a: Activiteit): { ic: string; t: string; cls: string } {
  const naam = a.customer_name || "een klant";
  if (a.direction === "in") return a.meta === "lead" ? { ic: "📨", t: `Nieuwe lead van ${naam}`, cls: "in" } : { ic: "💬", t: `${naam} reageerde`, cls: "in" };
  if (a.direction === "out") {
    if (a.meta.startsWith("verkoper")) return { ic: "✍️", t: `Jij stuurde ${naam} een bericht`, cls: "you" };
    if (a.meta.startsWith("dag")) return { ic: "🔁", t: `Occapilot stuurde ${naam} een herinnering`, cls: "ai" };
    return { ic: "⚡", t: `Occapilot beantwoordde ${naam}`, cls: "ai" };
  }
  if (a.meta === "afspraak") return { ic: "✓", t: `Proefrit gepland met ${naam}`, cls: "ok" };
  if (a.meta === "escalatie") return { ic: "👤", t: `${naam} is aan jou overgedragen`, cls: "esc" };
  if (a.meta === "stop") return { ic: "✋", t: `${naam} heeft zich afgemeld`, cls: "muted" };
  if (a.meta === "overname") return { ic: "🤝", t: a.subject || `Gesprek met ${naam} bijgewerkt`, cls: "you" };
  return { ic: "•", t: a.subject || `Update bij ${naam}`, cls: "muted" };
}

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ welkom?: string }> }) {
  const dealer = (await currentDealer())!;
  const sp = await searchParams;
  const d = db();

  const all = d
    .prepare("SELECT * FROM leads WHERE dealer_id=? ORDER BY (status='escalatie') DESC, created_at DESC LIMIT 300")
    .all(dealer.id) as Lead[];
  const laneOf = (l: Lead) => statusInfo(l.status).lane;
  const count = { jij: 0, ai: 0, klaar: 0 } as Record<Lane, number>;
  for (const l of all) count[laneOf(l)]++;

  const bellen = all
    .filter((l) => l.status === "escalatie" || (l.qual_label === "Heet" && laneOf(l) === "ai"))
    .slice(0, 4);

  const month = new Date().toISOString().slice(0, 7);
  const afspraken = all.filter((l) => l.status === "afspraak" && l.created_at.startsWith(month)).length;
  const marge = afspraken * 1200;

  const activiteit = d
    .prepare(
      `SELECT m.id, m.lead_id, m.direction, m.subject, m.meta, m.created_at, l.customer_name, l.vehicle
       FROM messages m JOIN leads l ON l.id = m.lead_id
       WHERE l.dealer_id=? AND m.meta NOT IN ('info')
       ORDER BY m.created_at DESC, m.id DESC LIMIT 7`
    )
    .all(dealer.id) as Activiteit[];

  const echteLead = all.some((l) => !l.raw_email.includes("testklant@voorbeeld.nl"));
  const stappen = [
    { done: all.length > 0, t: "Zie Occapilot aan het werk", s: "Stuur een voorbeeldlead en kijk hoe hij binnen seconden wordt beantwoord." },
    { done: echteLead, t: "Stuur je leads door naar Occapilot", s: "Eén doorstuurregel per kanaal in je mailbox. Daarna komt elke lead hier binnen." },
    { done: !!dealer.settings_checked, t: "Controleer je gegevens en proefritrooster", s: "Occapilot ondertekent met jouw naam en stelt alleen afspraken voor binnen jouw rooster." },
  ];
  const klaar = stappen.filter((s) => s.done).length;

  const domain = process.env.INBOUND_DOMAIN || "…";
  const inboundAddress = `leads-${dealer.inbound_token}@${domain}`;

  const samenvatting =
    all.length === 0
      ? "Nog geen leads. Volg de stappen hieronder, dan staat Occapilot vandaag nog aan."
      : count.jij > 0
        ? `Er ${count.jij === 1 ? "wacht 1 lead" : `wachten ${count.jij} leads`} op jou. Occapilot heeft ${count.ai} ${count.ai === 1 ? "lead" : "leads"} onder handen.`
        : `Niemand wacht op je. Occapilot heeft ${count.ai} ${count.ai === 1 ? "lead" : "leads"} onder handen.`;

  return (
    <>
      {sp.welkom && (
        <div className="demobar ok">
          <span className="demobar-ic">✓</span>
          <div>
            <b>Welkom bij Occapilot, {dealer.seller_name}!</b>
            <span>Je account staat klaar. Loop de drie stappen hieronder door en je tweede verkoper gaat aan de slag.</span>
          </div>
        </div>
      )}

      <div className="pagehead">
        <div className="titles">
          <h1>{groet()}, <em>{dealer.seller_name}</em></h1>
          <span className="subtitle">{samenvatting}</span>
        </div>
        <TestLeadButton compact />
      </div>

      {klaar < stappen.length && (
        <div className="card start">
          <div className="start-head">
            <div>
              <span className="cardtitle">🚀 Aan de slag</span>
              <span className="note">{klaar} van {stappen.length} stappen gedaan</span>
            </div>
            <div className="start-bar"><i style={{ width: `${(klaar / stappen.length) * 100}%` }} /></div>
          </div>
          <ol className="start-list">
            {stappen.map((s, i) => (
              <li key={s.t} className={s.done ? "done" : ""}>
                <span className="start-n">{s.done ? "✓" : i + 1}</span>
                <div className="start-body">
                  <b>{s.t}</b>
                  <span>{s.s}</span>
                  {!s.done && i === 0 && <div><TestLeadButton /></div>}
                  {!s.done && i === 1 && (
                    <div className="start-inbound">
                      <InboundAddress address={inboundAddress} />
                      <Link href="/handleiding#instellen" className="start-link">Hoe stel ik dit in? →</Link>
                    </div>
                  )}
                  {!s.done && i === 2 && <div><Link href="/instellingen#rooster" className="btn ghost small">Naar je rooster →</Link></div>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="lanes">
        {LANES.map((l) => (
          <Link key={l.key} href={`/leads?bak=${l.key}`} className={`lane ${l.key} ${l.key === "jij" && count.jij > 0 ? "alert" : ""}`}>
            <span className="lane-ic">{l.icon}</span>
            <b><CountUp to={count[l.key]} /></b>
            <span className="lane-t">{l.titel}</span>
            <span className="lane-s">{l.sub}</span>
          </Link>
        ))}
        <div className="kpi grad lane-kpi">
          <span className="kic">💰</span>
          <span className="label">Marge-impact deze maand</span>
          <b><CountUp to={marge} prefix="€ " /></b>
          <span className="sub">{afspraken} {afspraken === 1 ? "proefrit" : "proefritten"} × ≈ € 1.200 marge</span>
        </div>
      </div>

      <div className="dash-grid">
        <div className="card bellen">
          <div className="bellen-head">
            <div>
              <span className="cardtitle">📞 Vandaag bellen</span>
              <span className="note">Bovenaan wat op jou wacht, daarna de hete leads.</span>
            </div>
            {bellen.length > 0 && <span className="bellen-count">{bellen.length}</span>}
          </div>
          {bellen.length === 0 ? (
            <div className="bellen-empty">✓ Niemand wacht op je. Occapilot heeft alles onder controle.</div>
          ) : (
            <div className="bellen-grid">
              {bellen.map((l) => (
                <div key={l.id} className={`bel compact ${l.status === "escalatie" ? "esc" : "hot"}`}>
                  <div className="bel-top">
                    <span className={`pill ${l.status === "escalatie" ? "hot" : "heat"}`}>{l.status === "escalatie" ? "👤 Actie nodig" : "🔥 Heet"}</span>
                    <Plate p={l.license_plate} />
                  </div>
                  <div className="bel-info">
                    <b>{l.customer_name || "Onbekend"} <span className="bel-car">· {l.vehicle || "Onbekende auto"}</span></b>
                    <p>{l.status === "escalatie" ? l.escalation_reason : l.qual_reason}</p>
                  </div>
                  <div className="bel-actions">
                    {l.customer_phone && <a className="btn small" href={`tel:${l.customer_phone.replace(/\s/g, "")}`}>📞 Bel</a>}
                    <Link className="btn ghost small" href={`/leads/${l.id}`}>Open →</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card feed">
          <div className="bellen-head">
            <div>
              <span className="cardtitle">⚡ Laatste activiteit</span>
              <span className="note">Wat Occapilot en jij recent hebben gedaan.</span>
            </div>
            <span className="app-live"><i />Live</span>
          </div>
          {activiteit.length === 0 ? (
            <p className="note" style={{ margin: 0 }}>Nog geen activiteit.</p>
          ) : (
            <ul className="feed-list">
              {activiteit.map((a) => {
                const x = activiteitTekst(a);
                return (
                  <li key={a.id}>
                    <Link href={`/leads/${a.lead_id}`} className={`feed-item ${x.cls}`}>
                      <span className="feed-ic">{x.ic}</span>
                      <span className="feed-t">{x.t}<small>{a.vehicle}</small></span>
                      <span className="feed-when">{wanneer(a.created_at)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          <Link href="/leads" className="start-link">Alle leads bekijken →</Link>
        </div>
      </div>
    </>
  );
}
