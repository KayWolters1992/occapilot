import Link from "next/link";
import { db } from "@/lib/db";
import { currentDealer } from "@/lib/auth";
import type { Lead } from "@/lib/types";
import { InboundAddress, TestLeadButton } from "./OnboardingCard";
import { CountUp } from "../../_lp/Interactive";

export const dynamic = "force-dynamic";

function Bars({ label }: { label: string }) {
  const cls = label === "Heet" ? "heet" : label === "Koud" ? "koud" : "warm";
  return (
    <span className={`bars ${cls}`} title={`${label}e lead`} aria-label={`${label}e lead`}>
      <i /><i /><i />
    </span>
  );
}

function Plate({ p }: { p: string }) {
  if (!p) return <span>—</span>;
  return <span className="plate"><span className="eu">NL</span><span className="num">{p.toUpperCase()}</span></span>;
}

function StatusPill({ l }: { l: Lead }) {
  switch (l.status) {
    case "escalatie": return <span className="pill hot" title={l.escalation_reason}>⚠ Actie nodig</span>;
    case "afspraak": return <span className="pill ok">✓ Afspraak</span>;
    case "gestopt": return <span className="pill wait">Afgemeld</span>;
    case "gesloten": return <span className="pill wait">Gesloten</span>;
    case "wacht": return <span className="pill wait">Wacht op klant</span>;
    default: return <span className="pill ai">AI volgt op</span>;
  }
}

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ welkom?: string; status?: string }> }) {
  const dealer = (await currentDealer())!;
  const sp = await searchParams;
  const d = db();
  const statusFilter = sp.status || "";
  const leads = (
    statusFilter
      ? d
          .prepare("SELECT * FROM leads WHERE dealer_id=? AND status=? ORDER BY created_at DESC LIMIT 200")
          .all(dealer.id, statusFilter)
      : d
          .prepare("SELECT * FROM leads WHERE dealer_id=? ORDER BY (status='escalatie') DESC, created_at DESC LIMIT 200")
          .all(dealer.id)
  ) as Lead[];

  const plateCounts = new Map<string, number>();
  for (const row of d
    .prepare(
      `SELECT license_plate, COUNT(*) n FROM leads
       WHERE dealer_id=? AND license_plate!='' AND status NOT IN ('gesloten','gestopt')
       GROUP BY license_plate`
    )
    .all(dealer.id) as { license_plate: string; n: number }[]) {
    plateCounts.set(row.license_plate, row.n);
  }

  const month = new Date().toISOString().slice(0, 7);
  const stat = (sql: string) => (d.prepare(sql).get(dealer.id, `${month}%`) as { n: number }).n;
  const total = stat("SELECT COUNT(*) n FROM leads WHERE dealer_id=? AND created_at LIKE ?");
  const afspraken = stat("SELECT COUNT(*) n FROM leads WHERE dealer_id=? AND created_at LIKE ? AND status='afspraak'");
  const escal = (d.prepare("SELECT COUNT(*) n FROM leads WHERE dealer_id=? AND status='escalatie'").get(dealer.id) as { n: number }).n;
  const marge = afspraken * 1200;

  const domain = process.env.INBOUND_DOMAIN || "…";
  const inboundAddress = `leads-${dealer.inbound_token}@${domain}`;

  return (
    <>
      {sp.welkom && (
        <div className="alertbar" style={{ borderColor: "var(--amber-line)", background: "var(--amber-soft)" }}>
          <span className="ic" style={{ background: "var(--grad)", color: "#fff" }}>✓</span>
          <span style={{ flex: 1, fontSize: 13.5 }}>
            <b>Welkom bij Occapilot!</b> Je account staat klaar. Stel hieronder je lead-instroom in. Daarna doet Occapilot de rest.
          </span>
        </div>
      )}
      <div className="pagehead">
        <div className="titles">
          <h1>Leadoverzicht <em>{dealer.name}</em></h1>
          <span className="subtitle">Elke lead binnen 2 minuten beantwoord en opgevolgd tot de proefrit. Jij ziet hier wie je moet bellen.</span>
        </div>
        <span className="app-live"><i />Occapilot actief</span>
        <Link href="/handleiding" className="btn ghost small">📖 Handleiding</Link>
      </div>

      {leads.length === 0 && !statusFilter && (
        <div className="card">
          <span className="cardtitle">Aan de slag in 2 stappen</span>
          <div className="kvrow" style={{ justifyContent: "flex-start", gap: 10, alignItems: "flex-start" }}>
            <b style={{ color: "var(--blue-deep)" }}>1.</b>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ color: "var(--ink)", fontWeight: 500 }}>Stuur je lead-mails (AutoScout24, AutoTrack, Marktplaats, website) automatisch door naar dit adres:</span>
              <InboundAddress address={inboundAddress} />
            </div>
          </div>
          <div className="kvrow" style={{ justifyContent: "flex-start", gap: 10, alignItems: "flex-start" }}>
            <b style={{ color: "var(--blue-deep)" }}>2.</b>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ color: "var(--ink)", fontWeight: 500 }}>Klaar! Vanaf nu beantwoordt en volgt Occapilot elke lead vanzelf op.</span>
              <span className="note">Nieuwsgierig hoe dat eruitziet? Probeer het meteen met een voorbeeldlead:</span>
              <TestLeadButton />
            </div>
          </div>
        </div>
      )}

      <div className="kpis">
        <div className="kpi"><span className="kic">📨</span><span className="label">Leads deze maand</span><b><CountUp to={total} /></b><span className="sub">uit alle kanalen</span></div>
        <div className="kpi"><span className="kic">✓</span><span className="label">Proefritten gepland</span><b><CountUp to={afspraken} /></b><span className="sub">door Occapilot ingepland</span></div>
        <div className={`kpi ${escal > 0 ? "esc" : ""}`}><span className="kic">🔔</span><span className="label">Actie nodig</span><b><CountUp to={escal} /></b><span className="sub">{escal > 0 ? "wacht op jou" : "alles onder controle"}</span></div>
        <div className="kpi grad"><span className="kic">💰</span><span className="label">Indicatieve marge-impact</span><b><CountUp to={marge} prefix="€ " /></b><span className="sub">≈ proefritten × € 1.200 marge</span></div>
      </div>

      <div className="card">
        <span className="cardtitle">
          {statusFilter === "escalatie" ? "Leads · actie nodig" : statusFilter === "afspraak" ? "Leads · afspraken" : "Leads"}
        </span>
        {leads.length === 0 ? (
          <p className="note" style={{ margin: 0 }}>
            {statusFilter ? "Geen leads in dit filter." : "Hier verschijnen je leads zodra ze binnenkomen."}
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
                    {l.vehicle || "—"}
                    <span className="sub">
                      {l.price}
                      {plateCounts.get(l.license_plate)! > 1 && (
                        <> · <b style={{ color: "var(--amber-ink)" }}>{plateCounts.get(l.license_plate)! - 1} andere lead(en)</b></>
                      )}
                    </span>
                  </td>
                  <td><Plate p={l.license_plate} /></td>
                  <td style={{ color: "var(--muted)" }}>{l.source || "—"}</td>
                  <td><StatusPill l={l} /></td>
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
