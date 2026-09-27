import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { currentDealer } from "@/lib/auth";
import { closeLead } from "../../../actions";
import type { Lead, Msg, Followup, RdwInfo } from "@/lib/types";
import { ReplyBox, TypedText } from "./LeadClient";

export const dynamic = "force-dynamic";

export default async function LeadDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ nieuw?: string; t?: string; verzonden?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
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

  const lastOutId = msgs.map((m) => m.direction === "out" && !m.meta.startsWith("verkoper") ? m.id : 0).reduce((a, b) => Math.max(a, b), 0);

  return (
    <>
      <div className="pagehead">
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", flex: 1 }}>
          <Link href="/leads" style={{ color: "var(--muted)", fontSize: 13, fontWeight: 500 }}>← Leads</Link>
          <h1 style={{ fontSize: 24 }}>{lead.customer_name || "Onbekende klant"}</h1>
          <span className="note">{lead.vehicle} · {lead.source}</span>
        </div>
        <form action={closeLead} style={{ display: "flex", gap: 10 }}>
          <input type="hidden" name="id" value={lead.id} />
          {lead.status === "escalatie" && (
            <button className="btn small" name="status" value="wacht">Afgehandeld, AI mag door</button>
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

      {sp.nieuw && lastOutId > 0 && (
        <div className="demobar">
          <span className="demobar-ic">⚡</span>
          <div>
            <b>Occapilot heeft deze lead {sp.t ? `in ${sp.t} ${sp.t === "1" ? "seconde" : "seconden"}` : "direct"} beantwoord.</b>
            <span>Klant, auto en vraag uitgelezen, kenteken gecheckt, score bepaald en een persoonlijk antwoord geschreven.</span>
          </div>
        </div>
      )}
      {sp.verzonden && (
        <div className="demobar ok">
          <span className="demobar-ic">✓</span>
          <div>
            <b>Je bericht staat in het gesprek.</b>
            <span>{lead.status === "overgenomen" ? "Jij voert dit gesprek nu. Occapilot blijft stil tot jij het teruggeeft." : "Occapilot pakt het weer op zodra de klant antwoordt."}</span>
          </div>
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
            <span className="cardlabel">Tijdlijn</span>
            <div className="tl">
              <div className="tl-item done"><i /><div><b>Lead binnengekomen</b><span>{lead.source || "onbekend kanaal"} · {lead.created_at.slice(5, 16).replace("T", " ")}</span></div></div>
              {msgs.some((m) => m.direction === "out" && !m.meta.startsWith("verkoper")) && (
                <div className="tl-item done"><i /><div><b>Persoonlijk beantwoord</b><span>door Occapilot, in jouw naam</span></div></div>
              )}
              {fups.map((f) => (
                <div key={f.id} className={`tl-item ${f.status === "verzonden" ? "done" : f.status === "gepland" ? "next" : "skip"}`}>
                  <i />
                  <div>
                    <b>Herinnering {f.label.replace("dag", "dag ")}</b>
                    <span>
                      {f.status === "verzonden" ? "verstuurd" : f.status === "gepland" ? "gepland" : "niet nodig, klant reageerde"} · {(f.sent_at ?? f.due_at).slice(5, 16).replace("T", " ")}
                    </span>
                  </div>
                </div>
              ))}
              {lead.status === "afspraak" && <div className="tl-item done ok"><i /><div><b>Proefrit gepland</b><span>jij krijgt de klant in de showroom</span></div></div>}
              {lead.status === "escalatie" && <div className="tl-item next esc"><i /><div><b>Wacht op jou</b><span>{lead.escalation_reason}</span></div></div>}
              {lead.status === "overgenomen" && <div className="tl-item next"><i /><div><b>Jij voert het gesprek</b><span>Occapilot blijft stil</span></div></div>}
              {lead.status === "gestopt" && <div className="tl-item skip"><i /><div><b>Klant heeft zich afgemeld</b><span>er wordt niets meer verstuurd</span></div></div>}
            </div>
          </div>
        </div>

        <div className="card">
          <span className="cardtitle">Gesprek <span className="note" style={{ fontWeight: 400 }}>· e-mail, volledig gelogd</span></span>
          <div className="thread">
            {msgs.map((m) => {
              const isDealer = m.direction === "out" && m.meta.startsWith("verkoper");
              const failed = m.meta.includes("mislukt") || m.meta.includes("niet verzonden");
              const typeIt = sp.nieuw && m.id === lastOutId;
              return (
                <div key={m.id} className={`turn ${m.direction === "in" ? "in" : m.direction === "system" ? "system" : isDealer ? "dealer" : ""}`}>
                  <span className="who">
                    {m.direction === "in" ? (lead.customer_name || "Klant") :
                     m.direction === "system" ? `→ ${m.subject || "Systeem"}` :
                     isDealer ? `${dealer.seller_name} (jij)` : "Occapilot"}
                    {" "}<span className="when">· {m.created_at.slice(5, 16).replace("T", " ")}</span>
                    {failed && m.direction === "out" && <span className="unsent">{m.meta.includes("geen e-mailadres") ? "niet verstuurd · klant heeft geen e-mailadres" : "niet verstuurd · e-mail nog niet gekoppeld"}</span>}
                  </span>
                  <div className="bub">
                    {m.direction !== "system" && m.subject ? `${m.subject}\n\n` : ""}
                    {typeIt ? <TypedText text={m.body} /> : m.body}
                  </div>
                </div>
              );
            })}
          </div>
          {!["gestopt", "gesloten"].includes(lead.status) && (
            <ReplyBox leadId={lead.id} sellerName={dealer.seller_name} escalated={lead.status === "escalatie"} />
          )}
        </div>
      </div>
    </>
  );
}
