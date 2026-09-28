import { wanneer } from "@/components/LeadBits";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { currentDealer } from "@/lib/auth";
import { closeLead } from "../../../actions";
import type { Lead, Msg, Followup, RdwInfo } from "@/lib/types";
import { ReplyBox, TypedText } from "./LeadClient";
import { statusInfo } from "@/lib/status";
import { StatusPill } from "@/components/StatusPill";
import { LogoMark } from "@/components/Logo";

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
    .prepare("SELECT * FROM messages WHERE lead_id=? ORDER BY created_at, id")
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

  const info = statusInfo(lead.status);
  const nextFup = fups.find((f) => f.status === "gepland");
  const lastOutId = msgs.map((m) => m.direction === "out" && !m.meta.startsWith("verkoper") ? m.id : 0).reduce((a, b) => Math.max(a, b), 0);

  return (
    <>
      <div className="pagehead">
        <div className="titles">
          <Link href="/leads" className="backlink">← Terug naar overzicht</Link>
          <h1>{lead.customer_name || "Onbekende klant"} <StatusPill status={lead.status} /></h1>
          <span className="subtitle">{lead.vehicle || "Onbekende auto"}{lead.source ? ` · via ${lead.source}` : ""} · binnengekomen {wanneer(lead.created_at)}</span>
        </div>
      </div>

      <div className={`beurt ${info.lane} ${lead.status}`}>
        <div className="beurt-ic">{info.icon}</div>
        <div className="beurt-body">
          <span className="beurt-kicker">{info.lane === "jij" ? "Jij bent aan zet" : info.lane === "ai" ? "RepRight is bezig" : "Afgerond"}</span>
          <b>{lead.status === "escalatie" && lead.escalation_reason ? lead.escalation_reason : info.uitleg}</b>
          <span className="beurt-next">
            <em>Wat doe jij?</em> {info.jijDoet}
            {info.lane === "ai" && nextFup && <> Volgende herinnering: {nextFup.label.replace("dag", "dag ")} op {wanneer(nextFup.due_at)}.</>}
          </span>
        </div>
        <form action={closeLead} className="beurt-actions">
          <input type="hidden" name="id" value={lead.id} />
          {lead.customer_phone && info.lane !== "klaar" && (
            <a className="btn small" href={`tel:${lead.customer_phone.replace(/\s/g, "")}`}>📞 Bel {lead.customer_phone}</a>
          )}
          {lead.status === "afspraak" && lead.customer_phone && (
            <a className="btn small" href={`tel:${lead.customer_phone.replace(/\s/g, "")}`}>📞 Bevestig: {lead.customer_phone}</a>
          )}
          {info.lane !== "klaar" && <a className="btn ghost small" href="#antwoord">✍️ Zelf reageren</a>}
          {info.lane === "jij" && (
            <button className="btn ghost small" name="status" value="wacht">🤖 Geef terug aan RepRight</button>
          )}
          {lead.status !== "gesloten" && lead.status !== "gestopt" && (
            <button className="btn ghost small subtle" name="status" value="gesloten">Sluit lead</button>
          )}
          {lead.status === "gesloten" && (
            <button className="btn ghost small" name="status" value="wacht">Heropen lead</button>
          )}
        </form>
      </div>

      {sp.nieuw && lastOutId > 0 && (
        <div className="demobar">
          <span className="demobar-ic">⚡</span>
          <div>
            <b>RepRight heeft deze lead {sp.t ? `in ${sp.t} ${sp.t === "1" ? "seconde" : "seconden"}` : "direct"} beantwoord.</b>
            <span>Klant, auto en vraag uitgelezen, kenteken gecheckt, score bepaald en een persoonlijk antwoord geschreven.</span>
          </div>
        </div>
      )}
      {sp.verzonden && (
        <div className="demobar ok">
          <span className="demobar-ic">✓</span>
          <div>
            <b>Je bericht staat in het gesprek.</b>
            <span>{lead.status === "overgenomen" ? "Jij voert dit gesprek nu. RepRight blijft stil tot jij het teruggeeft." : "RepRight pakt het weer op zodra de klant antwoordt."}</span>
          </div>
        </div>
      )}
      {lead.question && (
        <div className="klantvraag">
          <span className="klantvraag-ic">💬</span>
          <div>
            <span className="klantvraag-k">Vraag van {lead.customer_name || "de klant"}{lead.source ? ` via ${lead.source}` : ""}</span>
            <q>{lead.question}</q>
          </div>
          <a href="#gesprek" className="start-link">Lees het hele gesprek ↓</a>
        </div>
      )}

      <div className="detailgrid">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card">
            <span className="cardlabel">Klant</span>
            <div className="kvrow"><span>Naam</span><b>{lead.customer_name || "—"}</b></div>
            <div className="kvrow"><span>E-mail</span><b>{lead.customer_email || "—"}</b></div>
            <div className="kvrow"><span>Telefoon</span><b>{lead.customer_phone || "—"}</b></div>
            <div className="kvrow"><span>Score</span><b>{lead.qual_label ? (
              <span className={`pill ${lead.qual_label === "Heet" ? "heat" : lead.qual_label === "Warm" ? "warmp" : "wait"}`}>
                {lead.qual_label === "Heet" ? "🔥 Heet" : lead.qual_label === "Warm" ? "☀️ Warm" : "❄️ Koud"}
              </span>
            ) : "—"}</b></div>
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
              <div className="tl-item done"><i /><div><b>Lead binnengekomen</b><span>{lead.source || "onbekend kanaal"} · {wanneer(lead.created_at)}</span></div></div>
              {msgs.some((m) => m.direction === "out" && !m.meta.startsWith("verkoper")) && (
                <div className="tl-item done"><i /><div><b>Persoonlijk beantwoord</b><span>door RepRight, in jouw naam</span></div></div>
              )}
              {fups.map((f) => (
                <div key={f.id} className={`tl-item ${f.status === "verzonden" ? "done" : f.status === "gepland" ? "next" : "skip"}`}>
                  <i />
                  <div>
                    <b>Herinnering {f.label.replace("dag", "dag ")}</b>
                    <span>
                      {f.status === "verzonden" ? "verstuurd" : f.status === "gepland" ? "gepland" : "niet nodig, klant reageerde"} · {wanneer(f.sent_at ?? f.due_at)}
                    </span>
                  </div>
                </div>
              ))}
              {lead.status === "afspraak" && <div className="tl-item done ok"><i /><div><b>Proefrit gepland</b><span>jij krijgt de klant in de showroom</span></div></div>}
              {lead.status === "escalatie" && <div className="tl-item next esc"><i /><div><b>Wacht op jou</b><span>{lead.escalation_reason}</span></div></div>}
              {lead.status === "overgenomen" && <div className="tl-item next"><i /><div><b>Jij voert het gesprek</b><span>RepRight blijft stil</span></div></div>}
              {lead.status === "gestopt" && <div className="tl-item skip"><i /><div><b>Klant heeft zich afgemeld</b><span>er wordt niets meer verstuurd</span></div></div>}
            </div>
          </div>
        </div>

        <div className="card" id="gesprek">
          <div className="chat-head">
            <span className="cardtitle">Gesprek</span>
            <div className="chat-legend">
              <span className="lg-klant"><i />Klant</span>
              <span className="lg-ai"><i />RepRight</span>
              <span className="lg-jij"><i />Jij</span>
            </div>
          </div>
          <div className="chat">
            {msgs.map((m) => {
              if (m.direction === "system") {
                return (
                  <div key={m.id} className={`chat-event ${m.meta}`}>
                    <span><b>{m.subject || "Update"}</b>{m.body ? ` · ${m.body}` : ""}</span>
                    <small>{wanneer(m.created_at)}</small>
                  </div>
                );
              }
              const isKlant = m.direction === "in";
              const isDealer = m.direction === "out" && m.meta.startsWith("verkoper");
              const failed = m.meta.includes("mislukt") || m.meta.includes("niet verzonden");
              const typeIt = sp.nieuw && m.id === lastOutId;
              const isLead = m.meta === "lead";
              const soort = isKlant ? "klant" : isDealer ? "jij" : "ai";
              const naamKlant = lead.customer_name || "Klant";
              const tekst = isLead ? schoonLead(m.body) : m.body;
              const label = m.meta.startsWith("dag") ? `Herinnering ${m.meta.replace("dag", "dag ").split(" (")[0]}` : isLead ? `Aanvraag via ${lead.source || "online"}` : "";
              return (
                <div key={m.id} className={`msg ${soort}`}>
                  <span className="msg-av">
                    {soort === "ai" ? <LogoMark size={22} onDark /> : initialen(soort === "klant" ? naamKlant : dealer.seller_name)}
                  </span>
                  <div className="msg-col">
                    <span className="msg-who">
                      <b>{soort === "klant" ? naamKlant : soort === "jij" ? `Jij (${dealer.seller_name})` : "RepRight"}</b>
                      {soort === "ai" && <em>namens {dealer.seller_name}</em>}
                      {label && <span className="msg-tag">{label}</span>}
                      <span className="msg-when">{wanneer(m.created_at)}</span>
                    </span>
                    <div className="msg-bub">
                      {m.subject && !isLead && <span className="msg-subj">{m.subject}</span>}
                      {typeIt ? <TypedText text={tekst} /> : tekst}
                      {isLead && (
                        <details className="msg-raw">
                          <summary>Originele e-mail tonen</summary>
                          <pre>{m.body}</pre>
                        </details>
                      )}
                    </div>
                    {failed && m.direction === "out" && (
                      <span className="unsent">{m.meta.includes("geen e-mailadres") ? "niet verstuurd · klant heeft geen e-mailadres" : "niet verstuurd · e-mail nog niet gekoppeld"}</span>
                    )}
                  </div>
                </div>
              );
            })}
            {info.lane === "ai" && fups.filter((f) => f.status === "gepland").slice(0, 1).map((f) => (
              <div key={f.id} className="msg ai planned">
                <span className="msg-av"><LogoMark size={22} onDark /></span>
                <div className="msg-col">
                  <span className="msg-who">
                    <b>RepRight</b><span className="msg-tag">Gepland: herinnering {f.label.replace("dag", "dag ")}</span>
                    <span className="msg-when">{wanneer(f.due_at)}</span>
                  </span>
                  <details className="msg-bub">
                    <summary>Alleen als de klant niet reageert. Tekst bekijken</summary>
                    <span className="msg-subj">{f.subject}</span>
                    {f.body}
                  </details>
                </div>
              </div>
            ))}
          </div>
          {!["gestopt", "gesloten"].includes(lead.status) && (
            <div id="antwoord">
              <ReplyBox leadId={lead.id} sellerName={dealer.seller_name} escalated={lead.status === "escalatie"} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function initialen(naam: string) {
  return naam.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "?";
}

/** Toon van een binnengekomen lead-mail alleen het bericht, zonder kopregels. */
function schoonLead(raw: string) {
  const regels = raw.split("\n");
  let i = 0;
  while (i < regels.length && (/^(van|aan|onderwerp|datum|from|to|subject|date)\s*:/i.test(regels[i]) || regels[i].trim() === "")) i++;
  return regels.slice(i).join("\n").trim() || raw;
}
