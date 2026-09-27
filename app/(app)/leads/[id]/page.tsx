import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { currentDealer } from "@/lib/auth";
import { closeLead } from "../../../actions";
import type { Lead, Msg, Followup, RdwInfo } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function LeadDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dealer = (await currentDealer())!;
  const d = db();
  const lead = d
    .prepare("SELECT * FROM leads WHERE id=? AND dealer_id=?")
    .get(Number(id), dealer.id) as Lead | undefined;
  if (!lead) notFound();

  const msgs = d
    .prepare("SELECT * FROM messages WHERE lead_id=? AND meta != 'lead' ORDER BY created_at")
    .all(lead.id) as Msg[];
  const fups = d
    .prepare("SELECT * FROM followups WHERE lead_id=? ORDER BY due_at")
    .all(lead.id) as Followup[];
  const rdw = lead.rdw_json ? (JSON.parse(lead.rdw_json) as RdwInfo) : null;
  const rivals = lead.license_plate
    ? (d
        .prepare(
          `SELECT COUNT(*) n FROM leads WHERE dealer_id=? AND license_plate=? AND id!=? AND status NOT IN ('gesloten','gestopt')`
        )
        .get(dealer.id, lead.license_plate, lead.id) as { n: number }).n
    : 0;

  return (
    <>
      <div className="pagehead">
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", flex: 1 }}>
          <Link href="/leads" style={{ color: "var(--muted)", fontSize: 13, fontWeight: 500 }}>← Leads</Link>
          <h1 style={{ fontSize: 19 }}>{lead.customer_name || "Onbekende klant"}</h1>
          <span className="note">{lead.vehicle} · {lead.source}</span>
        </div>
        <form action={closeLead} style={{ display: "flex", gap: 10 }}>
          <input type="hidden" name="id" value={lead.id} />
          {lead.status === "escalatie" && (
            <button className="btn small" name="status" value="wacht">Afgehandeld — AI mag door</button>
          )}
          {lead.status !== "gesloten" && (
            <button className="btn ghost small" name="status" value="gesloten">Sluit lead</button>
          )}
        </form>
      </div>

      {lead.status === "escalatie" && (
        <div className="alertbar">
          <span className="ic">!</span>
          <span style={{ flex: 1, fontSize: 13.5 }}><b>Escalatie.</b> {lead.escalation_reason}</span>
          {lead.customer_phone && <span className="btn danger small" style={{ cursor: "default" }}>Bel {lead.customer_phone}</span>}
        </div>
      )}

      <div className="detailgrid">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card">
            <span className="cardlabel">Klant</span>
            <div className="kvrow"><span>Naam</span><b>{lead.customer_name || "—"}</b></div>
            <div className="kvrow"><span>E-mail</span><b>{lead.customer_email || "—"}</b></div>
            <div className="kvrow"><span>Telefoon</span><b>{lead.customer_phone || "—"}</b></div>
            <div className="kvrow"><span>Kwalificatie</span><b>{lead.qual_label || "—"}</b></div>
            {lead.qual_reason && <p className="note" style={{ margin: 0 }}>{lead.qual_reason}</p>}
          </div>

          <div className="card">
            <span className="cardlabel">Voertuig</span>
            <div className="kvrow"><span>Auto</span><b>{lead.vehicle || "—"}</b></div>
            <div className="kvrow"><span>Vraagprijs</span><b>{lead.price || "—"}</b></div>
            <div className="kvrow">
              <span>Kenteken</span>
              <b>{lead.license_plate ? (
                <span className="plate"><span className="eu">NL</span><span className="num">{lead.license_plate.toUpperCase()}</span></span>
              ) : "—"}</b>
            </div>
            {rdw && (
              <>
                {rdw.trekgewicht_geremd && <div className="kvrow"><span>Trekgewicht geremd</span><b>{rdw.trekgewicht_geremd}</b></div>}
                {rdw.apk_tot && <div className="kvrow"><span>APK geldig tot</span><b>{rdw.apk_tot}</b></div>}
                {rdw.kleur && <div className="kvrow"><span>Kleur</span><b>{rdw.kleur}</b></div>}
                <span className="pill ok" style={{ alignSelf: "flex-start" }}>✓ Geverifieerd via RDW</span>
              </>
            )}
            {rivals > 0 && (
              <span className="pill hot" style={{ alignSelf: "flex-start" }}>
                👀 {rivals} andere lopende lead{rivals > 1 ? "s" : ""} op dit voertuig
              </span>
            )}
          </div>

          <div className="card">
            <span className="cardlabel">Opvolgplan</span>
            {fups.length === 0 && <p className="note" style={{ margin: 0 }}>Geen opvolging gepland.</p>}
            {fups.map((f) => (
              <div className="kvrow" key={f.id}>
                <span>{f.label} · {f.status}</span>
                <b>{(f.sent_at ?? f.due_at).slice(5, 16).replace("T", " ")}</b>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <span className="cardtitle">Gesprek <span className="note" style={{ fontWeight: 400 }}>— e-mail, volledig gelogd</span></span>
          <div className="thread">
            {msgs.map((m) => (
              <div key={m.id} className={`turn ${m.direction === "in" ? "in" : m.direction === "system" ? "system" : ""}`}>
                <span className="who">
                  {m.direction === "in" ? (lead.customer_name || "Klant") :
                   m.direction === "system" ? `→ ${m.subject || "Systeem"}` : `Occapilot · ${m.meta}`}
                  {" "}<span className="when">· {m.created_at.slice(5, 16).replace("T", " ")}</span>
                </span>
                <div className="bub">{m.direction !== "system" && m.subject ? `${m.subject}\n\n` : ""}{m.body}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
