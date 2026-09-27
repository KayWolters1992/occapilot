import Link from "next/link";
import { db } from "@/lib/db";
import { currentDealer } from "@/lib/auth";
import type { Lead } from "@/lib/types";
import { statusInfo, LANES, type Lane } from "@/lib/status";
import { StatusPill } from "@/components/StatusPill";
import { InboundAddress, TestLeadButton } from "./OnboardingCard";
import { CountUp } from "../../_lp/Interactive";

export const dynamic = "force-dynamic";

function Bars({ label }: { label: string }) {
  const cls = label === "Heet" ? "heet" : label === "Koud" ? "koud" : "warm";
  return (
    <span className={`bars ${cls}`} title={`${label || "Onbekend"}e lead`} aria-label={`${label || "Onbekend"}e lead`}>
      <i /><i /><i />
    </span>
  );
}

function Plate({ p }: { p: string }) {
  if (!p) return <span className="dim">geen kenteken</span>;
  return <span className="plate"><span className="eu">NL</span><span className="num">{p.toUpperCase()}</span></span>;
}

function groet() {
  const h = Number(new Intl.DateTimeFormat("nl-NL", { hour: "numeric", hour12: false, timeZone: "Europe/Amsterdam" }).format(new Date()));
  return h < 6 ? "Goedenacht" : h < 12 ? "Goedemorgen" : h < 18 ? "Goedemiddag" : "Goedenavond";
}

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ welkom?: string; bak?: string }> }) {
  const dealer = (await currentDealer())!;
  const sp = await searchParams;
  const d = db();
  const bak = (["jij", "ai", "klaar"].includes(sp.bak || "") ? sp.bak : "") as Lane | "";

  const all = d
    .prepare("SELECT * FROM leads WHERE dealer_id=? ORDER BY (status='escalatie') DESC, created_at DESC LIMIT 300")
    .all(dealer.id) as Lead[];
  const laneOf = (l: Lead) => statusInfo(l.status).lane;
  const count = { jij: 0, ai: 0, klaar: 0 } as Record<Lane, number>;
  for (const l of all) count[laneOf(l)]++;
  const leads = bak ? all.filter((l) => laneOf(l) === bak) : all;

  const plateCounts = new Map<string, number>();
  for (const l of all) {
    if (!l.license_plate || ["gesloten", "gestopt"].includes(l.status)) continue;
    plateCounts.set(l.license_plate, (plateCounts.get(l.license_plate) || 0) + 1);
  }

  const bellen = all
    .filter((l) => l.status === "escalatie" || (l.qual_label === "Heet" && laneOf(l) === "ai"))
    .slice(0, 4);

  const month = new Date().toISOString().slice(0, 7);
  const afspraken = all.filter((l) => l.status === "afspraak" && l.created_at.startsWith(month)).length;
  const marge = afspraken * 1200;

  // Aan de slag-checklist
  const echteLead = all.some((l) => !l.raw_email.includes("testklant@voorbeeld.nl"));
  const stappen = [
    { done: all.length > 0, t: "Zie Occapilot aan het werk", s: "Stuur een voorbeeldlead en kijk hoe hij binnen seconden wordt beantwoord." },
    { done: echteLead, t: "Stuur je leads door naar Occapilot", s: "Eén doorstuurregel per kanaal in je mailbox. Daarna komt elke lead hier binnen." },
    { done: !!dealer.settings_checked, t: "Controleer je gegevens en proefritmomenten", s: "Occapilot ondertekent met jouw naam en stelt alleen afspraken voor binnen jouw tijden. Check het even en klik op Opslaan." },
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

  const laneTitel = bak ? LANES.find((x) => x.key === bak)!.titel : "Alle leads";

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
        <span className="app-live"><i />Occapilot actief</span>
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
          <Link key={l.key} href={bak === l.key ? "/leads" : `/leads?bak=${l.key}`} className={`lane ${l.key} ${bak === l.key ? "on" : ""} ${l.key === "jij" && count.jij > 0 ? "alert" : ""}`}>
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

      {!bak && bellen.length > 0 && (
        <div className="card bellen">
          <div className="bellen-head">
            <div>
              <span className="cardtitle">📞 Vandaag bellen</span>
              <span className="note">Wie je als eerste belt. Bovenaan wat op jou wacht, daarna de hete leads.</span>
            </div>
            <span className="bellen-count">{bellen.length}</span>
          </div>
          <div className="bellen-grid">
            {bellen.map((l) => (
              <div key={l.id} className={`bel ${l.status === "escalatie" ? "esc" : "hot"}`}>
                <div className="bel-top">
                  <span className={`pill ${l.status === "escalatie" ? "hot" : "heat"}`}>{l.status === "escalatie" ? "👤 Actie nodig" : "🔥 Heet"}</span>
                  <Plate p={l.license_plate} />
                </div>
                <div className="bel-info">
                  <b>{l.customer_name || "Onbekend"} <span className="bel-car">· {l.vehicle || "Onbekende auto"}</span></b>
                  <p>{l.status === "escalatie" ? l.escalation_reason : l.qual_reason}</p>
                </div>
                <div className="bel-actions">
                  {l.customer_phone && <a className="btn small" href={`tel:${l.customer_phone.replace(/\s/g, "")}`}>📞 Bel {l.customer_phone}</a>}
                  <Link className="btn ghost small" href={`/leads/${l.id}`}>Open gesprek →</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="table-head">
          <span className="cardtitle">{laneTitel} <span className="note">({leads.length})</span></span>
          <nav className="tabs">
            <Link href="/leads" className={!bak ? "on" : ""}>Alles</Link>
            {LANES.map((l) => (
              <Link key={l.key} href={`/leads?bak=${l.key}`} className={bak === l.key ? "on" : ""}>{l.icon} {l.titel}</Link>
            ))}
          </nav>
        </div>
        {leads.length === 0 ? (
          <p className="note" style={{ margin: 0 }}>
            {bak === "jij" ? "✓ Niets wat op jou wacht." : bak ? "Hier staan nog geen leads." : "Hier verschijnen je leads zodra ze binnenkomen."}
          </p>
        ) : (
          <div className="tscroll">
            <table className="leads">
              <thead>
                <tr>
                  <th>Score</th><th>Klant</th><th>Voertuig</th><th>Kenteken</th>
                  <th>Bron</th><th>Status</th><th className="right">Ontvangen</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id} className={l.status === "escalatie" ? "esc" : ""}>
                    <td><Bars label={l.qual_label} /></td>
                    <td>
                      <Link href={`/leads/${l.id}`} style={{ fontWeight: 600 }}>{l.customer_name || "Onbekend"}</Link>
                      <span className="sub">{l.customer_phone || l.customer_email || "geen contactgegevens"}</span>
                    </td>
                    <td>
                      {l.vehicle || <span className="dim">onbekend</span>}
                      <span className="sub">
                        {l.price}
                        {(plateCounts.get(l.license_plate) || 0) > 1 && (
                          <> · <b style={{ color: "var(--amber-ink)" }}>👀 {plateCounts.get(l.license_plate)! - 1} andere lead(s) op deze auto</b></>
                        )}
                      </span>
                    </td>
                    <td><Plate p={l.license_plate} /></td>
                    <td style={{ color: "var(--muted)" }}>{l.source || "—"}</td>
                    <td><StatusPill status={l.status} title={l.status === "escalatie" ? l.escalation_reason : undefined} /></td>
                    <td className="right" style={{ color: "var(--faint)", fontSize: 12.5 }}>
                      {l.created_at.slice(5, 16).replace("T", " ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
