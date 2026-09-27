# Occapilot

**Elke online lead beantwoord, gekwalificeerd en opgevolgd tot er een proefrit staat — automatisch.**

Occapilot vangt de lead-e-mails van AutoScout24, AutoTrack en de eigen website van een autobedrijf op,
laat Claude de lead uitlezen en kwalificeren (heet/warm/koud), verrijkt met officiële RDW-voertuigdata,
stuurt binnen een minuut een persoonlijke eerste reactie namens de verkoper, en volgt daarna automatisch
op (dag 1/3/7) tot de klant reageert. Antwoorden van de klant worden door de AI afgehandeld, met harde
guardrails: bij een bod, boze klant of juridische vraag pauzeert de AI en krijgt de verkoper direct een melding.

## Architectuur

```
Portaal/website ──mail──▶ Postmark inbound ──webhook──▶ /api/inbound/<secret>
                                                            │
                              ┌─────────────────────────────┤
                              ▼                             ▼
                    nieuwe lead (leads-<token>@)   klantantwoord (lead-<id>-<sig>@)
                              │                             │
                    Claude: parse + kwalificatie   Claude: antwoord/escaleer/stop
                    RDW-verrijking (open data)              │
                    directe reactie via Postmark   reactie / melding aan verkoper
                    opvolgreeks gepland (dag 1/3/7)
                              │
              cron (elke 15 min) ▶ /api/cron ▶ verstuurt vervallen opvolgingen
                                              binnen venster 08.00–20.30 NL
```

- **Next.js 15** (App Router) — dashboard + API-routes in één deploybare app
- **SQLite** (better-sqlite3) — nul database-beheer; `DATABASE_PATH` wijst naar één bestand
- **Claude API** (`claude-opus-5`, gestructureerde output via Zod-schema's) — parsing, kwalificatie,
  reacties en de beslissing antwoord/escaleer/stop
- **Postmark** — inbound webhook + outbound verzending uit naam van de dealer
- **RDW open data** — gratis kenteken-verrijking (trekgewicht, APK, kleur, tellerstandoordeel)

## Snel starten (lokaal)

```bash
cp .env.example .env.local        # vul ANTHROPIC_API_KEY in; de rest mag eerst leeg/standaard
npm install
npm run dev                       # http://localhost:3000
```

Ga naar `http://localhost:3000` → **landingspagina** → "Gratis starten" → maak in de browser
een dealeraccount aan (zelf-registratie via `/registreren`; `npm run seed -- …` bestaat nog
voor het aanmaken via de CLI). Na registratie zie je meteen de onboarding met het
doorstuuradres en een knop **"Stuur een voorbeeldlead"** om de pijplijn direct te testen.
In de app zit ook een volledige **handleiding** (`/handleiding`) voor de dealer.

Zonder Postmark-token wordt er niets écht gemaild (de app logt dat), maar de hele pijplijn werkt:
test 'm door als ingelogde gebruiker een lead te posten:

```bash
curl -X POST http://localhost:3000/api/test-lead \
  -H "Content-Type: application/json" \
  -H "Cookie: occ_session=<kopieer uit je browser>" \
  -d '{"raw": "Voertuig: BMW 318i Touring, 2019\nKenteken: G-671-RD\nVraagprijs: € 24.900\nNaam: Linda de Boer\nE-mail: linda@voorbeeld.nl\nTelefoon: 06 51 20 94 76\nBericht: Hoeveel mag deze trekken? Kan ik maandagavond langskomen?"}'
```

De lead verschijnt in het dashboard met kwalificatie, RDW-data, de gegenereerde eerste reactie
en de geplande opvolgreeks.

## Productie in 5 stappen

1. **Server**: elke Node-host met schijf werkt (Hetzner/DigitalOcean VPS, Railway, Fly.io).
   `npm run build && npm start`. *Let op: Vercel serverless heeft geen persistente schijf —
   gebruik daar een externe database (zie Upgraden) of kies een VPS.*
2. **Postmark**: maak een server aan; verifieer het afzenderdomein van de dealer (outbound) en
   stel een **inbound domain** in (bijv. `in.occapilot.nl`, MX naar Postmark). Zet de inbound
   webhook-URL op `https://jouwdomein/api/inbound/<CRON_SECRET>`.
3. **Env**: vul `.env` (zie `.env.example`) — `ANTHROPIC_API_KEY`, `POSTMARK_SERVER_TOKEN`,
   `INBOUND_DOMAIN`, `AUTH_SECRET`, `CRON_SECRET`, `APP_URL`, `DATABASE_PATH`.
4. **Cron**: elke 15 minuten `curl -H "Authorization: Bearer $CRON_SECRET" https://jouwdomein/api/cron`
   (crontab op de VPS, of een externe cron-dienst).
5. **Dealer onboarden**: stuur de dealer naar `https://jouwdomein/registreren` — hij maakt zelf
   een account aan en ziet direct zijn doorstuuradres `leads-<token>@<INBOUND_DOMAIN>` plus de
   handleiding. Eén e-mail-doorstuur instellen in AutoScout24/AutoTrack/website en hij is live.

## Guardrails (in de prompts, `src/lib/ai.ts`)

- Nooit kortingen, prijs- of garantietoezeggingen; alleen feiten uit de lead of RDW-data
- Beschikbaarheid nooit claimen; afspraakmomenten alleen binnen de ingestelde openingstijden
- Bod / inruilwaarde / boze klant / juridisch → AI stopt inhoudelijk, verkoper krijgt melding
- Aanspreekvorm van de klant wordt gespiegeld (je/u); afmeldzin in dag 3/7; "stop" stopt alles
- Elke klantreactie annuleert de geplande reeks; verzending alleen tussen 08.00–20.30 NL

## Upgraden later

- **Postgres** i.p.v. SQLite: `src/lib/db.ts` is de enige plek met SQL-setup; de queries zijn
  standaard-SQL en verhuizen vrijwel 1-op-1 (gebruik dan `pg` + een pool)
- **WhatsApp** (dag 1-opvolging): voeg een BSP toe (360dialog/Twilio) in `src/lib/mailer.ts`-stijl;
  het datamodel (channel-kolom) is er al
- **Marktplaats-chat**: geen publieke API — fase 2 via partnerkoppeling (LEF/Trengo-route)
- **Voorraadkoppeling** (auto verkocht → reeks stopt + alternatief): haak aan op Hexon/DoorlinQ-feed

## Structuur

```
app/api/inbound/[token]/route.ts   Postmark webhook (nieuwe leads + klantantwoorden)
app/api/cron/route.ts              opvolg-verzender (venster 08.00–20.30)
app/api/test-lead/route.ts         lead simuleren zonder Postmark
app/(app)/leads[/…]                dashboard (monochrome Occapilot-stijl)
src/lib/ai.ts                      Claude-prompts + schema's (intake & reply)
src/lib/pipeline.ts                de kernlogica
src/lib/rdw.ts                     RDW open data-verrijking
src/lib/mailer.ts                  Postmark outbound + dealer-meldingen
src/lib/db.ts                      SQLite-schema
scripts/seed.ts                    dealer aanmaken
```
