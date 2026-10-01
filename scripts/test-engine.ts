/**
 * Scenario-test van de RepRight-machine met de test-AI (geen API-sleutel nodig).
 *   REPRIGHT_FAKE_AI=1 DATABASE_PATH=/tmp/x.db npx tsx scripts/test-engine.ts
 */
import fs from "node:fs";
import { db } from "../src/lib/db";
import {
  handleNewLead, handleCustomerReply, planAfspraakDoorVerkoper,
  sendAfspraakHerinneringen, herinnerVerkopers, bezetteTijden,
} from "../src/lib/pipeline";
import { replySig } from "../src/lib/auth";
import { nextSlots, parseSchedule, planningForAI, nuLokaal } from "../src/lib/schedule";
import type { Dealer, Lead } from "../src/lib/types";

let fouten = 0;
const ok = (cond: unknown, wat: string) => {
  console.log(`${cond ? "✓" : "✗"} ${wat}`);
  if (!cond) fouten++;
};

const d = db();
d.prepare(
  "INSERT INTO dealers (name, city, seller_name, email, password_hash, from_email, inbound_token) VALUES (?,?,?,?,?,?,?)"
).run("Autobedrijf Test", "Maastricht", "Kay", "kay@test.nl", "x", "kay@test.nl", "tok123");
const dealer = d.prepare("SELECT * FROM dealers WHERE inbound_token='tok123'").get() as Dealer;
const lead = (id: number) => d.prepare("SELECT * FROM leads WHERE id=?").get(id) as Lead;
const fups = (id: number, status = "gepland") =>
  (d.prepare("SELECT label FROM followups WHERE lead_id=? AND status=?").all(id, status) as { label: string }[]).map((f) => f.label).join(",");
const reply = (id: number, tekst: string) => handleCustomerReply(id, replySig(id, lead(id).reply_secret), tekst);
const laatsteSysteem = (id: number) =>
  (d.prepare("SELECT subject FROM messages WHERE lead_id=? AND direction='system' ORDER BY id DESC LIMIT 1").get(id) as { subject: string } | undefined)?.subject;

async function main() {
  const schedule = parseSchedule("");
  const [slot1, slot2] = nextSlots(schedule, 2);

  console.log("\n1. Nieuwe lead");
  const a = (await handleNewLead(dealer, "Van: Anna Jansen <anna@test.nl>\nOnderwerp: BMW\n\nKan ik een proefrit maken?"))!;
  ok(lead(a).status === "actief", "status = actief (RepRight volgt op)");
  ok(fups(a) === "dag1,dag3,dag7", "herinneringen dag 1, 3 en 7 gepland");

  console.log("\n2. Klant stelt een vervolgvraag → opvolging gaat door");
  await reply(a, "Heeft hij een trekhaak?");
  ok(lead(a).status === "wacht", "status = wacht op klant");
  ok(fups(a, "geannuleerd") === "dag1,dag3,dag7", "oude herinneringen geannuleerd");
  ok(fups(a) === "dag2,dag5", "NIEUWE herinneringen dag 2 en 5 gepland");

  console.log("\n3. Klant kiest een vrij moment → proefrit met echte tijd");
  await reply(a, `Doe maar ${slot1.tijd}`);
  ok(lead(a).status === "afspraak", "status = proefrit gepland");
  ok(lead(a).afspraak_tijd === slot1.tijd, `afspraak_tijd = ${slot1.tijd}`);
  ok(fups(a) === "", "geen herinneringen meer gepland");
  ok(bezetteTijden(dealer.id).includes(slot1.tijd), "tijd staat als bezet geboekt");

  console.log("\n4. AI krijgt bezette tijden mee en stelt ze niet meer voor");
  const plan = planningForAI(schedule, new Date(), bezetteTijden(dealer.id));
  ok(plan.includes(`AL GEBOEKT`) && plan.includes(slot1.tijd), "prompt noemt het geboekte moment");
  ok(!nextSlots(schedule, 6, new Date(), [slot1.tijd]).some((m) => m.tijd === slot1.tijd), "geboekt moment niet meer in vrije momenten");

  console.log("\n5. Tweede klant wil hetzelfde moment → geen dubbele boeking");
  const b = (await handleNewLead(dealer, "Van: Bram de Boer <bram@test.nl>\nOnderwerp: BMW\n\nProefrit?"))!;
  await reply(b, `Kan ik ${slot1.tijd}?`);
  ok(lead(b).status === "escalatie", "niet bevestigd, naar verkoper");
  ok(/al een andere proefrit/.test(lead(b).escalation_reason), "reden noemt de dubbele boeking");
  ok(!!lead(b).escalated_at, "tijdstip van overdracht vastgelegd");

  console.log("\n6. Klant reageert terwijl de lead bij de verkoper ligt → RepRight blijft stil");
  const uitVoor = (d.prepare("SELECT COUNT(*) n FROM messages WHERE lead_id=? AND direction='out'").get(b) as { n: number }).n;
  await reply(b, "Hallo? Hoor ik nog iets?");
  const uitNa = (d.prepare("SELECT COUNT(*) n FROM messages WHERE lead_id=? AND direction='out'").get(b) as { n: number }).n;
  ok(uitNa === uitVoor, "geen AI-antwoord verstuurd");
  ok(lead(b).status === "escalatie", "lead blijft bij de verkoper");

  console.log("\n7. Verkoper krijgt na 3 uur een tweede seintje");
  d.prepare("UPDATE leads SET escalated_at=datetime('now','-4 hours') WHERE id=?").run(b);
  const tienUur = new Date(); tienUur.setUTCHours(8, 0, 0, 0); // ~10:00 NL
  ok((await herinnerVerkopers(tienUur)) === 1, "één herinnering verstuurd");
  ok((await herinnerVerkopers(tienUur)) === 0, "niet nog een keer");

  console.log("\n8. Verkoper belt en legt zelf een afspraak vast");
  const r = await planAfspraakDoorVerkoper(dealer, lead(b), slot2.tijd, true);
  ok(r === "gepland" && lead(b).status === "afspraak", "afspraak vastgelegd");
  ok(lead(b).afspraak_tijd === slot2.tijd, "met de juiste tijd");
  ok(!!d.prepare("SELECT 1 FROM messages WHERE lead_id=? AND meta LIKE 'bevestiging%'").get(b), "bevestiging naar klant in het gesprek");

  console.log("\n9. Klant wil verzetten naar een ander vrij moment");
  const later = nextSlots(schedule, 6, new Date(), bezetteTijden(dealer.id)).at(-1)!.tijd;
  await reply(a, `Kan het ook ${later}?`);
  ok(lead(a).afspraak_tijd === later, `verzet naar ${later}`);
  ok(laatsteSysteem(a) === "Proefrit verzet", "gemarkeerd als verzet");

  console.log("\n10. Klant kan toch niet → proefrit vervalt, RepRight volgt weer op");
  await reply(a, "Sorry, het lukt die dag toch niet.");
  ok(lead(a).status === "wacht" && !lead(a).afspraak_tijd, "proefrit vervallen, status wacht");
  ok(fups(a) === "dag2,dag5", "opvolging weer gepland");

  console.log("\n11. Herinnering aan de klant een dag van tevoren");
  const morgen10 = new Date(tienUur.getTime() + 86400000);
  const c = (await handleNewLead(dealer, "Van: Cor <cor@test.nl>\n\nProefrit?"))!;
  const morgenTijd = nuLokaal(morgen10);
  d.prepare("UPDATE leads SET status='afspraak', afspraak_tijd=? WHERE id=?").run(morgenTijd, c);
  ok((await sendAfspraakHerinneringen(tienUur)) >= 1, "herinnering verstuurd");
  ok(lead(c).afspraak_herinnerd === 1, "gemarkeerd als herinnerd");
  const herinnering = d.prepare("SELECT subject FROM messages WHERE lead_id=? AND meta LIKE 'herinnering-afspraak%'").get(c) as { subject: string };
  ok(herinnering?.subject.startsWith("Tot morgen"), `onderwerp: "${herinnering?.subject}"`);
  ok((await sendAfspraakHerinneringen(tienUur)) === 0, "niet dubbel");

  console.log("\n12. Afmelden met 'stop'");
  await reply(c, "stop");
  ok(lead(c).status === "gestopt" && !lead(c).afspraak_tijd, "afgemeld en afspraak vrijgegeven");

  console.log("\n13. 's Nachts niets versturen");
  const nacht = new Date(); nacht.setUTCHours(1, 0, 0, 0);
  ok((await herinnerVerkopers(nacht)) === 0 && (await sendAfspraakHerinneringen(nacht)) === 0, "geen berichten buiten 08:00–20:30");

  console.log(`\n${fouten === 0 ? "ALLES GOED" : `${fouten} FOUT(EN)`}`);
  process.exit(fouten ? 1 : 0);
}

main();
process.on("exit", () => { try { fs.rmSync(process.env.DATABASE_PATH!, { force: true }); } catch {} });
