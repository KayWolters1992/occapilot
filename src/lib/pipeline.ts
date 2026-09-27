import crypto from "node:crypto";
import { db } from "./db";
import { intake, decideReply } from "./ai";
import { rdwLookup, rdwToText } from "./rdw";
import { sendEmail, notifyDealer } from "./mailer";
import { replyAddress, replySig } from "./auth";
import type { Dealer, Lead, Msg, Followup, RdwInfo } from "./types";

/* ── Verzendvenster: 08.00–20.30 Europe/Amsterdam ─────────────── */

export function withinSendWindow(now = new Date()): boolean {
  const parts = new Intl.DateTimeFormat("nl-NL", {
    timeZone: "Europe/Amsterdam",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  const t = h * 60 + m;
  return t >= 8 * 60 && t <= 20 * 60 + 30;
}

/** Aantal andere (nog lopende) leads van dezelfde dealer op hetzelfde kenteken. */
function competingLeadCount(dealerId: number, plate: string, excludeLeadId: number): number {
  if (!plate) return 0;
  const row = db()
    .prepare(
      `SELECT COUNT(*) n FROM leads
       WHERE dealer_id=? AND license_plate=? AND id!=? AND status NOT IN ('gesloten','gestopt')`
    )
    .get(dealerId, plate, excludeLeadId) as { n: number };
  return row.n;
}

function isoIn(days: number, atHourAms = 10): string {
  // due-moment: over N dagen om ~10.00 Amsterdamse tijd (grof: UTC-benadering is prima,
  // de cron verzendt toch alleen binnen het venster)
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(atHourAms - 1, 0, 0, 0); // NL is UTC+1/+2; iets vroeger plannen kan geen kwaad
  return d.toISOString();
}

/* ── Nieuwe lead verwerken ────────────────────────────────────── */

export async function handleNewLead(dealer: Dealer, rawEmail: string): Promise<number | null> {
  const d = db();

  // Voorlopige lead-rij zodat we een reply-adres hebben
  const secret = crypto.randomBytes(6).toString("hex");
  const ins = d
    .prepare("INSERT INTO leads (dealer_id, reply_secret, raw_email, status) VALUES (?,?,?, 'nieuw')")
    .run(dealer.id, secret, rawEmail);
  const leadId = Number(ins.lastInsertRowid);

  // Kenteken alvast grof zoeken voor RDW (AI verfijnt daarna)
  const plateGuess = rawEmail.match(/kenteken[:\s]*([A-Z0-9-]{6,10})/i)?.[1] ?? "";
  let rdw: RdwInfo | null = plateGuess ? await rdwLookup(plateGuess) : null;

  let result: Awaited<ReturnType<typeof intake>> = null;
  try {
    result = await intake(dealer, rawEmail, rdwToText(rdw));
  } catch (e) {
    console.error("[pipeline] intake mislukt:", e);
  }
  if (!result) {
    d.prepare("UPDATE leads SET status='escalatie', escalation_reason=? WHERE id=?")
      .run("AI kon de lead niet verwerken — handmatig oppakken.", leadId);
    await notifyDealer({
      dealerEmail: dealer.email,
      subject: "Occapilot: lead kon niet automatisch verwerkt worden",
      text: rawEmail.slice(0, 2000),
    });
    return leadId;
  }

  // RDW alsnog proberen als de AI wél een kenteken vond
  if (!rdw && result.lead.kenteken) rdw = await rdwLookup(result.lead.kenteken);

  // Meerdere leads op hetzelfde voertuig: kwalificatie nooit verlagen, wel verhogen + reden aanvullen.
  const plate = result.lead.kenteken || "";
  const rivals = competingLeadCount(dealer.id, plate, leadId);
  let qualLabel = result.kwalificatie.label;
  let qualReason = result.kwalificatie.reden;
  if (rivals > 0) {
    if (qualLabel === "Koud") qualLabel = "Warm";
    qualReason = `${qualReason} + Let op: ${rivals} andere lopende lead(en) op hetzelfde voertuig.`.trim();
  }

  d.prepare(
    `UPDATE leads SET status=?, qual_label=?, qual_reason=?, customer_name=?, customer_email=?,
     customer_phone=?, vehicle=?, license_plate=?, price=?, source=?, question=?, rdw_json=?,
     escalation_reason=?, updated_at=datetime('now') WHERE id=?`
  ).run(
    result.escalatie_nu ? "escalatie" : "actief",
    qualLabel,
    qualReason,
    result.lead.naam,
    result.lead.email,
    result.lead.telefoon,
    result.lead.auto,
    result.lead.kenteken,
    result.lead.prijs,
    result.lead.bron,
    result.lead.vraag,
    rdw ? JSON.stringify(rdw) : "",
    result.escalatie_nu ? result.escalatie_reden : "",
    leadId
  );

  addMsg(leadId, "in", result.lead.vraag ? `Lead: ${result.lead.vraag}` : "Nieuwe lead", rawEmail, "lead");

  // Directe reactie versturen (alleen als er een klant-e-mailadres is)
  if (result.lead.email) {
    const ok = await sendEmail({
      from: dealer.from_email,
      fromName: `${dealer.seller_name} — ${dealer.name}`,
      to: result.lead.email,
      replyTo: replyAddress(leadId, secret),
      subject: result.direct.onderwerp,
      text: result.direct.tekst,
    });
    addMsg(leadId, "out", result.direct.onderwerp, result.direct.tekst, ok ? "direct" : "direct (verzenden mislukt)");
  } else {
    addMsg(leadId, "system", "", "Geen e-mailadres in de lead — directe reactie niet verzonden.", "info");
  }

  // Opvolgreeks plannen (niet bij directe escalatie)
  if (!result.escalatie_nu && result.lead.email) {
    const dayNum: Record<string, number> = { dag1: 1, dag3: 3, dag7: 7 };
    const stmt = d.prepare(
      "INSERT INTO followups (lead_id, label, due_at, subject, body) VALUES (?,?,?,?,?)"
    );
    for (const f of result.followups) {
      stmt.run(leadId, f.dag, isoIn(dayNum[f.dag] ?? 3), f.onderwerp, f.tekst);
    }
  }

  if (result.escalatie_nu) {
    await notifyDealer({
      dealerEmail: dealer.email,
      subject: `🔔 Occapilot escalatie: ${result.lead.naam || "lead"} — ${result.lead.auto}`,
      text: `${result.escalatie_reden}\n\nKlant: ${result.lead.naam} · ${result.lead.telefoon || result.lead.email}\nBekijk: ${process.env.APP_URL}/leads/${leadId}`,
    });
  } else if (rivals > 0) {
    await notifyDealer({
      dealerEmail: dealer.email,
      subject: `👀 Occapilot: ${rivals + 1} leads op ${result.lead.auto || "hetzelfde voertuig"}`,
      text: `Er loopt nu een ${rivals + 1}e lead op kenteken ${plate}. Overweeg deze auto met voorrang te behandelen.\n\nNieuwste klant: ${result.lead.naam} · ${result.lead.telefoon || result.lead.email}\nBekijk: ${process.env.APP_URL}/leads/${leadId}`,
    });
  }

  return leadId;
}

/* ── Antwoord van de klant verwerken ──────────────────────────── */

export async function handleCustomerReply(leadId: number, sig: string, text: string): Promise<void> {
  const d = db();
  const lead = d.prepare("SELECT * FROM leads WHERE id=?").get(leadId) as Lead | undefined;
  if (!lead || replySig(leadId, lead.reply_secret) !== sig) return; // onbekend/ongeldig → negeren
  const dealer = d.prepare("SELECT * FROM dealers WHERE id=?").get(lead.dealer_id) as Dealer;

  addMsg(leadId, "in", "", text, "klant");
  cancelFollowups(leadId); // klant reageert → reeks stopt, gesprek gaat verder

  if (lead.status === "gestopt") return;

  const transcript = (d
    .prepare("SELECT * FROM messages WHERE lead_id=? ORDER BY created_at")
    .all(leadId) as Msg[])
    .filter((m) => m.meta !== "lead")
    .map((m) => `[${m.direction === "in" ? "Klant" : "Occapilot"}]\n${m.body}`)
    .join("\n\n");

  const rdw = lead.rdw_json ? (JSON.parse(lead.rdw_json) as RdwInfo) : null;
  const rivals = competingLeadCount(dealer.id, lead.license_plate, leadId);
  const competingText = rivals > 0
    ? `FEIT: er lopen momenteel ${rivals} andere lead(en) op hetzelfde kenteken (${lead.license_plate}).`
    : "";
  let result: Awaited<ReturnType<typeof decideReply>> = null;
  try {
    result = await decideReply(dealer, lead.raw_email, transcript, text, rdwToText(rdw), competingText);
  } catch (e) {
    console.error("[pipeline] decideReply mislukt:", e);
  }

  if (!result || result.actie === "escaleer") {
    const reden = result?.reden || "Klantantwoord vraagt om persoonlijke opvolging.";
    d.prepare("UPDATE leads SET status='escalatie', escalation_reason=?, updated_at=datetime('now') WHERE id=?")
      .run(reden, leadId);
    if (result?.tekst) await sendOut(dealer, lead, result.onderwerp || "Uw bericht", result.tekst, "escalatie-bevestiging");
    addMsg(leadId, "system", "Overdracht aan verkoper", reden, "escalatie");
    await notifyDealer({
      dealerEmail: dealer.email,
      subject: `🔔 Occapilot escalatie: ${lead.customer_name || "lead"} — ${lead.vehicle}`,
      text: `${reden}\n\nKlant: ${lead.customer_name} · ${lead.customer_phone || lead.customer_email}\nBekijk: ${process.env.APP_URL}/leads/${leadId}`,
    });
    return;
  }

  if (result.actie === "stop") {
    d.prepare("UPDATE leads SET status='gestopt', updated_at=datetime('now') WHERE id=?").run(leadId);
    if (result.tekst) await sendOut(dealer, lead, result.onderwerp || "Bevestiging", result.tekst, "stop");
    addMsg(leadId, "system", "Opvolgreeks gestopt", result.reden || "Afmelding verwerkt.", "stop");
    return;
  }

  // antwoord
  await sendOut(dealer, lead, result.onderwerp || `Re: uw vraag over de ${lead.vehicle}`, result.tekst, "antwoord");
  if (result.afspraak) {
    d.prepare("UPDATE leads SET status='afspraak', updated_at=datetime('now') WHERE id=?").run(leadId);
    addMsg(leadId, "system", "Afspraak", result.reden || "Klant koos een moment — bevestigd.", "afspraak");
    await notifyDealer({
      dealerEmail: dealer.email,
      subject: `✅ Occapilot afspraak: ${lead.customer_name || "lead"} — ${lead.vehicle}`,
      text: `${result.reden}\n\nKlant: ${lead.customer_name} · ${lead.customer_phone || lead.customer_email}\nBekijk: ${process.env.APP_URL}/leads/${leadId}`,
    });
  } else {
    d.prepare("UPDATE leads SET status='wacht', updated_at=datetime('now') WHERE id=?").run(leadId);
  }
}

/* ── Cron: geplande opvolgingen versturen ─────────────────────── */

export async function sendDueFollowups(): Promise<number> {
  if (!withinSendWindow()) return 0;
  const d = db();
  const due = d
    .prepare("SELECT * FROM followups WHERE status='gepland' AND due_at <= ? ORDER BY due_at LIMIT 25")
    .all(new Date().toISOString()) as Followup[];

  let sent = 0;
  for (const f of due) {
    const lead = d.prepare("SELECT * FROM leads WHERE id=?").get(f.lead_id) as Lead;
    if (!lead || !["actief", "wacht"].includes(lead.status) || !lead.customer_email) {
      d.prepare("UPDATE followups SET status='geannuleerd' WHERE id=?").run(f.id);
      continue;
    }
    const dealer = d.prepare("SELECT * FROM dealers WHERE id=?").get(lead.dealer_id) as Dealer;
    const ok = await sendOut(dealer, lead, f.subject, f.body, f.label);
    d.prepare("UPDATE followups SET status=?, sent_at=datetime('now') WHERE id=?")
      .run(ok ? "verzonden" : "geannuleerd", f.id);
    if (ok) sent++;
  }
  return sent;
}

/* ── Helpers ──────────────────────────────────────────────────── */

async function sendOut(dealer: Dealer, lead: Lead, subject: string, text: string, meta: string): Promise<boolean> {
  const ok = await sendEmail({
    from: dealer.from_email,
    fromName: `${dealer.seller_name} — ${dealer.name}`,
    to: lead.customer_email,
    replyTo: replyAddress(lead.id, lead.reply_secret),
    subject,
    text,
  });
  addMsg(lead.id, "out", subject, text, ok ? meta : `${meta} (verzenden mislukt)`);
  return ok;
}

function addMsg(leadId: number, direction: string, subject: string, body: string, meta: string) {
  db()
    .prepare("INSERT INTO messages (lead_id, direction, subject, body, meta) VALUES (?,?,?,?,?)")
    .run(leadId, direction, subject, body, meta);
}

export function cancelFollowups(leadId: number) {
  db().prepare("UPDATE followups SET status='geannuleerd' WHERE lead_id=? AND status='gepland'").run(leadId);
}
