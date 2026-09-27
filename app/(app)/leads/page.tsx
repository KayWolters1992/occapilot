import Link from "next/link";
import { db } from "@/lib/db";
import { currentDealer } from "@/lib/auth";
import type { Lead } from "@/lib/types";
import { statusInfo, LANES, type Lane } from "@/lib/status";
import { StatusPill } from "@/components/StatusPill";
import { Bars, Plate, wanneer } from "@/components/LeadBits";
import { TestLeadButton } from "./OnboardingCard";

export const dynamic = "force-dynamic";

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ bak?: string; q?: string }> }) {
  const dealer = (await currentDealer())!;
  const sp = await searchParams;
  const d = db();
  const bak = (["jij", "ai", "klaar"].includes(sp.bak || "") ? sp.bak : "") as Lane | "";
  const q = (sp.q || "").trim().toLowerCase();

  const all = d
    .prepare("SELECT * FROM leads WHERE dealer_id=? ORDER BY (status='escalatie') DESC, created_at DESC LIMIT 500")
    .all(dealer.id) as Lead[];
  const laneOf = (l: Lead) => statusInfo(l.status).lane;
  const zoek = (l: Lead) =>
    !q || [l.customer_name, l.vehicle, l.license_plate, l.customer_email, l.customer_phone, l.source]
      .some((v) => (v || "").toLowerCase().replace(/-/g, "").includes(q.replace(/-/g, "")));
  const gevonden = all.filter(zoek);
  const count = { jij: 0, ai: 0, klaar: 0 } as Record<Lane, number>;
  for (const l of gevonden) count[laneOf(l)]++;
  const leads = bak ? gevonden.filter((l) => laneOf(l) === bak) : gevonden;

  const plateCounts = new Map<string, number>();
  for (const l of all) {
    if (!l.license_plate || ["gesloten", "gestopt"].includes(l.status)) continue;
    plateCounts.set(l.license_plate, (plateCounts.get(l.license_plate) || 0) + 1);
  }
  const href = (b: string) => {
    const p = new URLSearchParams();
    if (b) p.set("bak", b);
    if (q) p.set("q", sp.q!);
    const s = p.toString();
    return s ? `/leads?${s}` : "/leads";
  };

  return (
    <>
      <div className="pagehead">
        <div className="titles">
          <h1>Leads</h1>
          <span className="subtitle">Alle leads op één plek. Zoek op naam, auto of kenteken, of filter op wie aan zet is.</span>
        </div>
        <TestLeadButton compact />
      </div>

      <div className="card">
        <div className="table-head">
          <nav className="tabs">
            <Link href={href("")} className={!bak ? "on" : ""}>Alles <span className="tab-n">{gevonden.length}</span></Link>
            {LANES.map((l) => (
              <Link key={l.key} href={href(l.key)} className={`${bak === l.key ? "on" : ""} ${l.key === "jij" && count.jij > 0 ? "alert" : ""}`}>
                {l.icon} {l.titel} <span className="tab-n">{count[l.key]}</span>
              </Link>
            ))}
          </nav>
          <form className="search" action="/leads">
            {bak && <input type="hidden" name="bak" value={bak} />}
            <span aria-hidden="true">🔎</span>
            <input type="text" name="q" defaultValue={sp.q || ""} placeholder="Zoek op naam, auto of kenteken…" aria-label="Zoek leads" />
            {q && <Link href={href(bak)} className="search-x" aria-label="Zoekopdracht wissen">✕</Link>}
          </form>
        </div>

        {leads.length === 0 ? (
          <div className="empty">
            {q ? <>Niets gevonden voor &ldquo;{sp.q}&rdquo;.</> : bak === "jij" ? "✓ Niets wat op jou wacht." : bak ? "Hier staan nog geen leads." : "Hier verschijnen je leads zodra ze binnenkomen."}
          </div>
        ) : (
          <div className="tscroll">
            <table className="leads">
              <thead>
                <tr>
                  <th>Score</th><th>Klant</th><th>Voertuig</th><th>Kenteken</th>
                  <th>Bron</th><th>Status</th><th className="right">Binnengekomen</th>
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
                    <td className="right" style={{ color: "var(--faint)", fontSize: 12.5 }}>{wanneer(l.created_at)}</td>
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
