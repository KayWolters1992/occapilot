import crypto from "node:crypto";
import { db } from "./db";
import { intake, decideReply } from "./ai";
import { rdwLookup, rdwToText } from "./rdw";
import { sendEmail, notifyDealer } from "./mailer";
import { replyAddress, replySig } from "./auth";
import { parseSchedule, normTijd, botsing, binnenRooster, afspraakLabel, nuLokaal, tijdMs } from "./schedule";
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

/** Komende geboekte proefritten van een dealer (Amsterdamse tijd), optioneel zonder één lead. */
export function bezetteTijden(dealerId: number, excludeLeadId = 0): string[] {
  const rows = db()
    .prepare("SELECT afspraak_tijd t FROM leads WHERE dealer_id=? AND id!=? AND status='afspraak' AND afspraak_tijd != ''")
    .all(dealerId, excludeLeadId) as { t: string }[];
  const nu = tijdMs(nuLokaal());
  return rows.map((r) => r.t).filter((t) => tijdMs(t) >= nu - 3600_000);
}

/** Afzender richting klant: via het RepRight-domein, met de naam van verkoper en bedrijf. */
function afzender(dealer: Dealer) {
  return {
    from: process.env.SENDER_EMAIL || dealer.from_email,
    fromName: `${dealer.seller_name} | ${dealer.name}`,
  };
}

/** Lead aan de verkoper geven: status, reden, tijdstip (voor de herinnering) en melding. */
async function geefAanVerkoper(dealer: Dealer, leadId: number, reden: string, wie: string) {
  db().prepare(
    "UPDATE leads SET status='escalatie', escalation_reason=?, escalated_at=datetime('now'), esc_herinnerd=0, updated_at=datetime('now') WHERE id=?"
  ).run(reden, leadId);
  await notifyDealer({
    dealerEmail: dealer.email,
    subject: `🔔 Wacht op jou: ${wie}`,
    text: `${reden}\n\nBekijk en reageer: ${process.env.APP_URL}/leads/${leadId}`,
  });
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
    result = await intake(dealer, rawEmail, rdwToText(rdw), bezetteTijden(dealer.id));
  } catch (e) {
    console.error("[pipeline] intake mislukt:", e);
  }
  if (!result) {
    await geefAanVerkoper(dealer, leadId, "RepRight kon deze lead niet automatisch lezen. Bekijk de originele mail en reageer zelf.", "lead kon niet automatisch verwerkt worden");
    addMsg(leadId, "in", "Nieuwe lead", rawEmail, "lead");
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
     escalation_reason=?, escalated_at=CASE WHEN ?='escalatie' THEN datetime('now') ELSE '' END,
     updated_at=datetime('now') WHERE id=?`
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
    result.escalatie_nu ? "escalatie" : "actief",
    leadId
  );

  addMsg(leadId, "in", result.lead.vraag ? `Lead: ${result.lead.vraag}` : "Nieuwe lead", rawEmail, "lead");

  // Directe reactie versturen (alleen als er een klant-e-mailadres is)
  if (result.lead.email) {
    const ok = await sendEmail({
      ...afzender(dealer),
      to: result.lead.email,
      replyTo: replyAddress(leadId, secret),
      subject: result.direct.onderwerp,
      text: result.direct.tekst,
    });
    addMsg(leadId, "out", result.direct.onderwerp, result.direct.tekst, ok ? "direct" : "direct (verzenden mislukt)");
  } else {
    addMsg(leadId, "system", "", "Geen e-mailadres in de lead. Directe reactie niet verzonden.", "info");
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
      subject: `🔔 Wacht op jou: ${result.lead.naam || "lead"} · ${result.lead.auto}`,
      text: `${result.escalatie_reden}\n\nKlant: ${result.lead.naam} · ${result.lead.telefoon || result.lead.email}\nBekijk: ${process.env.APP_URL}/leads/${leadId}`,
    });
  } else if (rivals > 0) {
    await notifyDealer({
      dealerEmail: dealer.email,
      subject: `👀 RepRight: ${rivals + 1} leads op ${result.lead.auto || "hetzelfde voertuig"}`,
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
  const wie = `${lead.customer_name || "Klant"} · ${lead.vehicle || "lead"}`;

  addMsg(leadId, "in", "", text, "klant");
  cancelFollowups(leadId); // klant reageert → lopende herinneringen stoppen
  d.prepare("UPDATE leads SET updated_at=datetime('now') WHERE id=?").run(leadId);

  if (lead.status === "gestopt") return;

  // Ligt het gesprek bij de verkoper (overgedragen of zelf overgenomen)? Dan blijft RepRight stil.
  if (lead.status === "overgenomen" || lead.status === "escalatie") {
    await notifyDealer({
      dealerEmail: dealer.email,
      subject: `💬 ${wie} reageerde`,
      text: `${text}\n\nDit gesprek ligt bij jou, RepRight antwoordt niet. Reageer hier: ${process.env.APP_URL}/leads/${leadId}`,
    });
    return;
  }

  const transcript = (d
    .prepare("SELECT * FROM messages WHERE lead_id=? ORDER BY created_at, id")
    .all(leadId) as Msg[])
    .filter((m) => m.meta !== "lead")
    .map((m) => `[${m.direction === "in" ? "Klant" : m.direction === "system" ? "Systeem" : "RepRight"}]\n${m.subject ? m.subject + ": " : ""}${m.body}`)
    .join("\n\n");

  const rdw = lead.rdw_json ? (JSON.parse(lead.rdw_json) as RdwInfo) : null;
  const rivals = competingLeadCount(dealer.id, lead.license_plate, leadId);
  const competingText = rivals > 0
    ? `FEIT: er lopen momenteel ${rivals} andere lead(en) op hetzelfde kenteken (${lead.license_plate}).`
    : "";
  const huidig = lead.status === "afspraak" && lead.afspraak_tijd ? `HUIDIGE AFSPRAAK van deze klant: ${afspraakLabel(lead.afspraak_tijd)} [${lead.afspraak_tijd}].` : "";
  const bezet = bezetteTijden(dealer.id, leadId);
  let result: Awaited<ReturnType<typeof decideReply>> = null;
  try {
    result = await decideReply(dealer, lead.raw_email, transcript, text, rdwToText(rdw), [competingText, huidig].filter(Boolean).join("\n"), bezet);
  } catch (e) {
    console.error("[pipeline] decideReply mislukt:", e);
  }

  if (!result || result.actie === "escaleer") {
    const reden = result?.reden || "RepRight kon dit antwoord niet goed plaatsen. Lees het even en reageer zelf.";
    if (result?.tekst) await sendOut(dealer, lead, result.onderwerp || "Uw bericht", result.tekst, "escalatie-bevestiging");
    addMsg(leadId, "system", "Overdracht aan verkoper", reden, "escalatie");
    await geefAanVerkoper(dealer, leadId, reden, wie);
    return;
  }

  if (result.actie === "stop") {
    d.prepare("UPDATE leads SET status='gestopt', afspraak_tijd='', updated_at=datetime('now') WHERE id=?").run(leadId);
    if (result.tekst) await sendOut(dealer, lead, result.onderwerp || "Bevestiging", result.tekst, "stop");
    addMsg(leadId, "system", "Opvolgreeks gestopt", result.reden || "Afmelding verwerkt.", "stop");
    if (lead.status === "afspraak") {
      await notifyDealer({ dealerEmail: dealer.email, subject: `❌ Proefrit gaat niet door: ${wie}`, text: `De klant heeft zich afgemeld.\n\n${process.env.APP_URL}/leads/${leadId}` });
    }
    return;
  }

  // ── Afspraak: alleen bevestigen als het moment echt vrij is en binnen het rooster valt
  if (result.afspraak) {
    const schedule = parseSchedule(dealer.schedule_json);
    const tijd = normTijd(result.afspraak_moment);
    const botst = tijd ? botsing(tijd, bezet, schedule.duur) : null;
    if (tijd && (botst || !binnenRooster(schedule, tijd))) {
      // Niet automatisch bevestigen: de verkoper kiest samen met de klant een ander moment.
      const reden = botst
        ? `De klant wil een proefrit op ${afspraakLabel(tijd)}, maar dan staat er al een andere proefrit (${afspraakLabel(botst)}). Kies samen een ander moment.`
        : `De klant wil een proefrit op ${afspraakLabel(tijd)}, maar dat valt buiten je proefritrooster. Bevestig het zelf of stel een ander moment voor.`;
      await sendOut(dealer, lead, `Re: ${lead.vehicle || "je proefrit"}`, `Dank je wel! ${dealer.seller_name} bevestigt het moment zo snel mogelijk persoonlijk.\n\n${dealer.seller_name} | ${dealer.name}`, "escalatie-bevestiging");
      addMsg(leadId, "system", "Overdracht aan verkoper", reden, "escalatie");
      await geefAanVerkoper(dealer, leadId, reden, wie);
      return;
    }
    await sendOut(dealer, lead, result.onderwerp || `Re: ${lead.vehicle}`, result.tekst, "antwoord");
    const verzet = lead.status === "afspraak" && lead.afspraak_tijd && tijd && lead.afspraak_tijd !== tijd;
    d.prepare("UPDATE leads SET status='afspraak', afspraak_tijd=?, afspraak_herinnerd=0, updated_at=datetime('now') WHERE id=?").run(tijd, leadId);
    const label = tijd ? afspraakLabel(tijd) : "tijd nog onbekend";
    addMsg(leadId, "system", verzet ? "Proefrit verzet" : "Proefrit gepland", `${label[0].toUpperCase()}${label.slice(1)}. ${result.reden || ""}`.trim(), "afspraak");
    await notifyDealer({
      dealerEmail: dealer.email,
      subject: `${verzet ? "🔁 Proefrit verzet" : "✅ Proefrit gepland"}: ${wie} · ${label}`,
      text: `${result.reden}\n\nKlant: ${lead.customer_name} · ${lead.customer_phone || lead.customer_email}\nBekijk: ${process.env.APP_URL}/leads/${leadId}`,
    });
    return;
  }

  // ── Gewoon antwoord: versturen en nieuwe opvolging inplannen
  await sendOut(dealer, lead, result.onderwerp || `Re: uw vraag over de ${lead.vehicle}`, result.tekst, "antwoord");
  d.prepare("UPDATE leads SET status='wacht', afspraak_tijd='', updated_at=datetime('now') WHERE id=?").run(leadId);
  if (lead.customer_email) {
    const dagen: Record<string, number> = { dag2: 2, dag5: 5 };
    const stmt = d.prepare("INSERT INTO followups (lead_id, label, due_at, subject, body) VALUES (?,?,?,?,?)");
    for (const f of result.herinneringen ?? []) stmt.run(leadId, f.dag, isoIn(dagen[f.dag] ?? 3), f.onderwerp, f.tekst);
  }
  if (lead.status === "afspraak") {
    addMsg(leadId, "system", "Proefrit vervallen", "De klant kan niet op het geplande moment. RepRight zoekt een nieuw moment.", "info");
    await notifyDealer({
      dealerEmail: dealer.email,
      subject: `↩️ Proefrit gaat niet door: ${wie}`,
      text: `De klant kan niet op ${lead.afspraak_tijd ? afspraakLabel(lead.afspraak_tijd) : "het geplande moment"}. RepRight stelt nieuwe momenten voor.\n\n${process.env.APP_URL}/leads/${leadId}`,
    });
  }
}

/* ── Verkoper neemt het gesprek over ──────────────────────────── */

export async function sendDealerReply(dealer: Dealer, lead: Lead, text: string, handBack: boolean): Promise<boolean> {
  const subject = `Re: ${lead.vehicle || "uw aanvraag"}`;
  let ok = false;
  if (lead.customer_email) {
    ok = await sendOut(dealer, lead, subject, text, "verkoper");
  } else {
    addMsg(lead.id, "out", subject, text, "verkoper (geen e-mailadres, niet verzonden)");
  }
  cancelFollowups(lead.id);
  db()
    .prepare("UPDATE leads SET status=?, escalation_reason='', updated_at=datetime('now') WHERE id=?")
    .run(handBack ? "wacht" : "overgenomen", lead.id);
  addMsg(
    lead.id,
    "system",
    handBack ? "Terug naar RepRight" : "Overgenomen door verkoper",
    handBack
      ? `${dealer.seller_name} heeft gereageerd. RepRight pakt het gesprek weer op zodra de klant antwoordt.`
      : `${dealer.seller_name} voert dit gesprek nu zelf. RepRight blijft stil.`,
    "overname"
  );
  return ok;
}

/* ── Verkoper legt zelf een afspraak vast (bijv. na een telefoontje) ── */

export async function planAfspraakDoorVerkoper(dealer: Dealer, lead: Lead, tijdIn: string, bevestig: boolean): Promise<string> {
  const tijd = normTijd(tijdIn);
  if (!tijd) return "ongeldig";
  const d = db();
  cancelFollowups(lead.id);
  const verzet = lead.status === "afspraak" && !!lead.afspraak_tijd && lead.afspraak_tijd !== tijd;
  d.prepare(
    "UPDATE leads SET status='afspraak', afspraak_tijd=?, afspraak_herinnerd=0, escalation_reason='', updated_at=datetime('now') WHERE id=?"
  ).run(tijd, lead.id);
  const label = afspraakLabel(tijd);
  addMsg(lead.id, "system", verzet ? "Proefrit verzet" : "Proefrit gepland", `${label[0].toUpperCase()}${label.slice(1)}, vastgelegd door ${dealer.seller_name}.`, "afspraak");
  if (bevestig && lead.customer_email) {
    const voornaam = (lead.customer_name || "").split(" ")[0];
    const schedule = parseSchedule(dealer.schedule_json);
    await sendOut(
      dealer,
      lead,
      verzet ? `Nieuw moment voor je proefrit` : `Bevestiging proefrit ${lead.vehicle || ""}`.trim(),
      [
        voornaam ? `Hallo ${voornaam},` : "Hallo,",
        "",
        `${verzet ? "Het nieuwe moment" : "Hierbij de bevestiging"}: de proefrit${lead.vehicle ? ` met de ${lead.vehicle}` : ""} staat gepland op ${label} bij ${dealer.name}${dealer.city ? ` in ${dealer.city}` : ""}.`,
        schedule.notitie.trim() ? `\n${schedule.notitie.trim()}` : "",
        "",
        "Lukt het onverhoopt niet? Antwoord dan even op deze mail, dan zoeken we een ander moment.",
        "",
        "Tot dan!",
        `${dealer.seller_name} | ${dealer.name}`,
      ].filter((r, i, a) => !(r === "" && a[i - 1] === "")).join("\n"),
      "bevestiging"
    );
  }
  return verzet ? "verzet" : "gepland";
}

/* ── Planner: elke paar minuten ───────────────────────────────── */

/** Klant een dag van tevoren herinneren aan de proefrit (alleen overdag). */
export async function sendAfspraakHerinneringen(now = new Date()): Promise<number> {
  if (!withinSendWindow(now)) return 0;
  const d = db();
  const nu = tijdMs(nuLokaal(now));
  const rows = d
    .prepare("SELECT * FROM leads WHERE status='afspraak' AND afspraak_tijd != '' AND afspraak_herinnerd=0 AND customer_email != ''")
    .all() as Lead[];
  let n = 0;
  for (const lead of rows) {
    const over = tijdMs(lead.afspraak_tijd!) - nu;
    if (over < 2 * 3600_000 || over > 26 * 3600_000) continue; // tussen 2 en 26 uur van tevoren
    d.prepare("UPDATE leads SET afspraak_herinnerd=1 WHERE id=?").run(lead.id);
    const dealer = d.prepare("SELECT * FROM dealers WHERE id=?").get(lead.dealer_id) as Dealer;
    const voornaam = (lead.customer_name || "").split(" ")[0];
    const label = afspraakLabel(lead.afspraak_tijd!);
    const tijdAlleen = label.split(" om ")[1] ?? "";
    const morgen = nuLokaal(new Date(now.getTime() + 86400000)).slice(0, 10) === lead.afspraak_tijd!.slice(0, 10);
    const schedule = parseSchedule(dealer.schedule_json);
    await sendOut(
      dealer,
      lead,
      `${morgen ? "Tot morgen" : "Tot straks"} om ${tijdAlleen}`,
      [
        voornaam ? `Hallo ${voornaam},` : "Hallo,",
        "",
        `Een korte herinnering: de proefrit${lead.vehicle ? ` met de ${lead.vehicle}` : ""} staat gepland op ${label} bij ${dealer.name}${dealer.city ? ` in ${dealer.city}` : ""}. De auto staat voor je klaar.`,
        schedule.notitie.trim() ? `\n${schedule.notitie.trim()}` : "",
        "",
        "Lukt het toch niet? Antwoord dan even op deze mail, dan zoeken we een ander moment.",
        "",
        "Tot dan!",
        `${dealer.seller_name} | ${dealer.name}`,
      ].filter((r, i, a) => !(r === "" && a[i - 1] === "")).join("\n"),
      "herinnering-afspraak"
    );
    n++;
  }
  return n;
}

/** Verkoper een tweede seintje geven als een overgedragen lead na 3 uur nog niet is opgepakt. */
export async function herinnerVerkopers(now = new Date()): Promise<number> {
  if (!withinSendWindow(now)) return 0;
  const d = db();
  const rows = d
    .prepare(
      `SELECT * FROM leads WHERE status='escalatie' AND esc_herinnerd=0 AND escalated_at != ''
       AND escalated_at <= datetime('now','-3 hours')`
    )
    .all() as Lead[];
  for (const lead of rows) {
    d.prepare("UPDATE leads SET esc_herinnerd=1 WHERE id=?").run(lead.id);
    const dealer = d.prepare("SELECT * FROM dealers WHERE id=?").get(lead.dealer_id) as Dealer;
    await notifyDealer({
      dealerEmail: dealer.email,
      subject: `⏰ Wacht nog steeds op jou: ${lead.customer_name || "klant"} · ${lead.vehicle || "lead"}`,
      text: `RepRight heeft de klant laten weten dat jij contact opneemt, maar dat is nog niet gebeurd.\n\nWaarom: ${lead.escalation_reason}\nKlant: ${lead.customer_name} · ${lead.customer_phone || lead.customer_email}\n\nReageer of bel: ${process.env.APP_URL}/leads/${lead.id}`,
    });
  }
  return rows.length;
}

/** Alles wat op tijd moet gebeuren, in één ronde. */
export async function tick() {
  const opvolging = await sendDueFollowups().catch((e) => (console.error("[tick] opvolging", e), 0));
  const afspraken = await sendAfspraakHerinneringen().catch((e) => (console.error("[tick] afspraken", e), 0));
  const verkopers = await herinnerVerkopers().catch((e) => (console.error("[tick] verkopers", e), 0));
  return { opvolging, afspraken, verkopers };
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
      .run(ok ? "verzonden" : "mislukt", f.id);
    if (ok) sent++;
  }
  return sent;
}

/* ── Helpers ──────────────────────────────────────────────────── */

async function sendOut(dealer: Dealer, lead: Lead, subject: string, text: string, meta: string): Promise<boolean> {
  const ok = await sendEmail({
    ...afzender(dealer),
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
