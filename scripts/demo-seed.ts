/**
 * Vult de database met een demo-dealer + realistische leads, zodat het platform
 * bekeken kan worden zonder Postmark/Anthropic-koppeling nodig te hebben.
 */
import crypto from "node:crypto";
import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";

const d = db();

// Dealer
const email = "kay@autobedrijfwolters.nl";
const password = "demo1234";
const token = crypto.randomBytes(5).toString("hex");

let dealerId: number;
const existing = d.prepare("SELECT id FROM dealers WHERE email=?").get(email) as { id: number } | undefined;
if (existing) {
  dealerId = existing.id;
} else {
  const info = d
    .prepare(
      "INSERT INTO dealers (name, city, seller_name, email, password_hash, from_email, inbound_token) VALUES (?,?,?,?,?,?,?)"
    )
    .run("Autobedrijf Wolters", "Maastricht", "Kay Wolters", email, hashPassword(password), "verkoop@autobedrijfwolters.nl", token);
  dealerId = Number(info.lastInsertRowid);
}

d.prepare("UPDATE dealers SET settings_checked=1, schedule_json='' WHERE id=?").run(dealerId);

// Schoon eerdere demo-leads op zodat dit script herhaalbaar is
d.prepare("DELETE FROM followups WHERE lead_id IN (SELECT id FROM leads WHERE dealer_id=?)").run(dealerId);
d.prepare("DELETE FROM messages WHERE lead_id IN (SELECT id FROM leads WHERE dealer_id=?)").run(dealerId);
d.prepare("DELETE FROM leads WHERE dealer_id=?").run(dealerId);

// Alle demo-tijden schuiven mee met vandaag, zodat de demo er altijd vers uitziet.
const SHIFT = Date.now() - Date.parse("2026-09-28T10:00:00Z");
const t = (ts: string) => new Date(Date.parse(ts.replace(" ", "T") + "Z") + SHIFT).toISOString().slice(0, 19).replace("T", " ");

function addLead(l: {
  status: string; qual_label: string; qual_reason: string; customer_name: string; customer_email: string;
  customer_phone: string; vehicle: string; license_plate: string; price: string; source: string; question: string;
  rdw_json?: string; escalation_reason?: string; created_at: string;
  msgs: { direction: "in" | "out" | "system"; subject?: string; body: string; meta?: string; created_at: string }[];
}) {
  const info = d
    .prepare(
      `INSERT INTO leads (dealer_id, reply_secret, status, qual_label, qual_reason, customer_name, customer_email,
        customer_phone, vehicle, license_plate, price, source, question, rdw_json, raw_email, escalation_reason, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    )
    .run(
      dealerId, crypto.randomBytes(6).toString("hex"), l.status, l.qual_label, l.qual_reason,
      l.customer_name, l.customer_email, l.customer_phone, l.vehicle, l.license_plate, l.price, l.source,
      l.question, l.rdw_json ?? "", `Van: ${l.customer_name} <${l.customer_email}>\n\n${l.question}`,
      l.escalation_reason ?? "", t(l.created_at), t(l.created_at)
    );
  const leadId = Number(info.lastInsertRowid);
  for (const m of l.msgs) {
    d.prepare("INSERT INTO messages (lead_id, direction, channel, subject, body, meta, created_at) VALUES (?,?,?,?,?,?,?)")
      .run(leadId, m.direction, "email", m.subject ?? "", m.body, m.meta ?? "", t(m.created_at));
  }
  return leadId;
}

// 1) Escalatie, klant vraagt om korting
addLead({
  status: "escalatie",
  qual_label: "Heet",
  qual_reason: "Reageert binnen enkele minuten, vraagt actief naar proefrit en kenteken-info.",
  customer_name: "Mark Jansen",
  customer_email: "mark.jansen@gmail.com",
  customer_phone: "06-12345678",
  vehicle: "BMW 3-Serie 320i Touring",
  license_plate: "K-123-XZ",
  price: "€ 24.950",
  source: "AutoScout24",
  question: "Is er nog onderhandelingsruimte op de prijs? Ik kan snel beslissen als we eruit komen.",
  escalation_reason: "Klant vraagt expliciet om korting, buiten de bevoegdheid van de AI, verkoper moet zelf bellen.",
  created_at: "2026-09-27 08:14:00",
  msgs: [
    { direction: "in", subject: "Vraag over BMW 3-Serie 320i Touring", body: "Goedemorgen, ik zag de BMW 320i Touring op AutoScout24 staan. Mooie auto! Is er nog onderhandelingsruimte op de prijs? Ik kan snel beslissen als we eruit komen.", created_at: "2026-09-27 08:14:00" },
    { direction: "out", subject: "Re: BMW 3-Serie 320i Touring", body: "Hallo Mark, dank voor je interesse in de BMW 320i Touring! Over de prijs kan ik als digitale assistent zelf geen toezeggingen doen, daarvoor verbind ik je graag met Kay. Zullen we ondertussen een proefrit inplannen zodat je de auto meteen kunt ervaren?", created_at: "2026-09-27 08:16:00" },
    { direction: "system", subject: "Overdracht aan verkoper", meta: "escalatie", body: "Klant vraagt om korting. Dat is aan de verkoper, dus RepRight heeft het gesprek overgedragen.", created_at: "2026-09-27 08:16:05" },
  ],
});

// 2) AI volgt op, nette kwalificatievraag, RDW verrijkt
addLead({
  status: "actief",
  qual_label: "Warm",
  qual_reason: "Stelt gerichte vraag over trekgewicht, nog geen contactgegevens voor proefrit gedeeld.",
  customer_name: "Sanne de Vries",
  customer_email: "sanne.devries@outlook.com",
  customer_phone: "",
  vehicle: "Volkswagen Passat Variant 2.0 TDI",
  license_plate: "P-456-BH",
  price: "€ 18.450",
  source: "Marktplaats",
  question: "Wat is het geremde trekgewicht van deze Passat? Ik wil er een caravan achter hangen.",
  rdw_json: JSON.stringify({ merk: "Volkswagen", handelsbenaming: "Passat", apk_tot: "14-03-2027", trekgewicht_geremd: "1.800 kg", kleur: "Grijs", km_stand_oordeel: "Logisch" }),
  created_at: "2026-09-26 19:42:00",
  msgs: [
    { direction: "in", subject: "Vraag over Volkswagen Passat Variant", body: "Hoi, wat is het geremde trekgewicht van deze Passat? Ik wil er een caravan achter hangen.", created_at: "2026-09-26 19:42:00" },
    { direction: "out", subject: "Re: Volkswagen Passat Variant", body: "Hoi Sanne, goede vraag! Volgens de RDW-gegevens van deze auto is het geremde trekgewicht 1.800 kg, ruim voldoende voor de meeste caravans. De auto heeft een geldige APK tot 14-03-2027 en een logische kilometerstand. Zullen we een proefrit inplannen? Dan kun je meteen voelen hoe hij met een aanhanger rijdt.", created_at: "2026-09-26 19:44:00" },
  ],
});

// 3) Afspraak bevestigd
addLead({
  status: "afspraak",
  qual_label: "Heet",
  qual_reason: "Heeft zelf om een proefritafspraak gevraagd en telefoonnummer gedeeld.",
  customer_name: "Ahmed El Idrissi",
  customer_email: "a.elidrissi@gmail.com",
  customer_phone: "06-98765432",
  vehicle: "Audi A4 Avant 40 TDI",
  license_plate: "V-789-KL",
  price: "€ 27.900",
  source: "Website",
  question: "Kan ik zaterdag om 11:00 een proefrit komen doen?",
  rdw_json: JSON.stringify({ merk: "Audi", handelsbenaming: "A4", apk_tot: "22-11-2026", trekgewicht_geremd: "2.000 kg", kleur: "Zwart", km_stand_oordeel: "Logisch" }),
  created_at: "2026-09-25 12:05:00",
  msgs: [
    { direction: "in", subject: "Proefrit Audi A4 Avant", body: "Hallo, ik ben erg geïnteresseerd in de Audi A4 Avant. Kan ik zaterdag om 11:00 een proefrit komen doen? Mijn nummer is 06-98765432.", created_at: "2026-09-25 12:05:00" },
    { direction: "out", subject: "Re: Proefrit Audi A4 Avant", body: "Hallo Ahmed, wat leuk dat je een proefrit wilt inplannen! Zaterdag om 11:00 komt uit, je bent van harte welkom bij Autobedrijf Wolters in Maastricht. Kay neemt voor de zekerheid nog even telefonisch contact met je op ter bevestiging. Tot zaterdag!", created_at: "2026-09-25 12:07:00" },
    { direction: "system", subject: "Afspraak", meta: "afspraak", body: "Proefrit bevestigd voor zaterdag 11.00 in de Audi A4 Avant.", created_at: "2026-09-25 12:07:10" },
  ],
});

// 4) Koude lead, net binnen, AI volgt nog op (met geplande follow-up)
const koudeLeadId = addLead({
  status: "wacht",
  qual_label: "Koud",
  qual_reason: "Algemene informatievraag, geen tijdspad of contactgegevens genoemd.",
  customer_name: "Linda Bakker",
  customer_email: "l.bakker@hotmail.com",
  customer_phone: "",
  vehicle: "Toyota Yaris 1.5 Hybrid",
  license_plate: "N-321-FG",
  price: "€ 15.750",
  source: "AutoTrack",
  question: "Is deze Yaris nog beschikbaar en wat is het bouwjaar?",
  created_at: "2026-09-27 07:02:00",
  msgs: [
    { direction: "in", subject: "Vraag over Toyota Yaris", body: "Hoi, is deze Yaris nog beschikbaar en wat is het bouwjaar?", created_at: "2026-09-27 07:02:00" },
    { direction: "out", subject: "Re: Toyota Yaris", body: "Hoi Linda, deze Toyota Yaris 1.5 Hybrid is nog beschikbaar! Laat het gerust weten als je meer wilt weten of een keer wilt langskomen voor een proefrit.", created_at: "2026-09-27 07:04:00" },
  ],
});
d.prepare("INSERT INTO followups (lead_id, label, due_at, subject, body, status) VALUES (?,?,?,?,?,?)")
  .run(koudeLeadId, "dag3", t("2026-09-30 09:00:00").replace(" ", "T") + "Z", "Nog interesse in de Toyota Yaris?", "Hoi Linda, ik wilde even checken of je nog vragen hebt over de Yaris. Zin om een proefrit te plannen?", "gepland");

// 5) Tweede lead op dezelfde Audi A4 als Ahmed, test de "meerdere leads op dit voertuig"-badge
addLead({
  status: "actief",
  qual_label: "Warm",
  qual_reason: "Vraagt naar inruilmogelijkheid, nog geen afspraak. + Let op: 1 andere lopende lead(en) op hetzelfde voertuig.",
  customer_name: "Petra Willems",
  customer_email: "p.willems@gmail.com",
  customer_phone: "",
  vehicle: "Audi A4 Avant 40 TDI",
  license_plate: "V-789-KL",
  price: "€ 27.900",
  source: "AutoScout24",
  question: "Is inruil van mijn huidige auto mogelijk bij deze Audi A4?",
  rdw_json: JSON.stringify({ merk: "Audi", handelsbenaming: "A4", apk_tot: "22-11-2026", trekgewicht_geremd: "2.000 kg", kleur: "Zwart", km_stand_oordeel: "Logisch" }),
  created_at: "2026-09-27 09:30:00",
  msgs: [
    { direction: "in", subject: "Vraag over Audi A4 Avant", body: "Hoi, is inruil van mijn huidige auto mogelijk bij deze Audi A4?", created_at: "2026-09-27 09:30:00" },
    { direction: "out", subject: "Re: Audi A4 Avant", body: "Hoi Petra, inruil is zeker bespreekbaar! Kun je het kenteken en de kilometerstand van je huidige auto doorgeven? Dan neemt Kay de mogelijkheden persoonlijk met je door.", created_at: "2026-09-27 09:32:00" },
  ],
});

// Proefrit met echte tijd: eerstvolgende zaterdag 11:00; overdracht met tijdstip
{
  const nu = new Date();
  const za = new Date(Date.UTC(nu.getUTCFullYear(), nu.getUTCMonth(), nu.getUTCDate() + ((6 - nu.getUTCDay() + 7) % 7 || 7)));
  const tijd = `${za.toISOString().slice(0, 10)} 11:00`;
  d.prepare("UPDATE leads SET afspraak_tijd=? WHERE dealer_id=? AND status='afspraak'").run(tijd, dealerId);
  d.prepare("UPDATE messages SET subject='Proefrit gepland' WHERE meta='afspraak' AND lead_id IN (SELECT id FROM leads WHERE dealer_id=?)").run(dealerId);
  d.prepare("UPDATE leads SET escalated_at=updated_at WHERE dealer_id=? AND status='escalatie'").run(dealerId);
}

console.log("✓ Demo-data geladen.");
console.log(`  Login:     ${email}`);
console.log(`  Wachtwoord: ${password}`);
