import { currentDealer } from "@/lib/auth";

export const dynamic = "force-dynamic";

const STATUSSEN: { pill: string; label: string; uitleg: string }[] = [
  { pill: "ai", label: "AI volgt op", uitleg: "Occapilot heeft de lead beantwoord en stuurt vanzelf opvolgmails (na 1, 3 en 7 dagen) tot de klant reageert. Je hoeft niets te doen." },
  { pill: "wait", label: "Wacht op klant", uitleg: "De klant heeft een antwoord gekregen; Occapilot wacht op een reactie. Reageert de klant, dan gaat het gesprek automatisch verder." },
  { pill: "ok", label: "Afspraak bevestigd", uitleg: "De klant heeft een proefrit- of bezichtigingsmoment gekozen. Je krijgt hiervan direct een melding per e-mail. Bel of mail de klant ter bevestiging." },
  { pill: "hot", label: "Actie nodig", uitleg: "Occapilot heeft het gesprek bewust aan jou overgedragen (bod, inruilwaarde, boze klant of juridische vraag). De AI stuurt niets meer tot jij de lead afhandelt." },
  { pill: "wait", label: "Gestopt", uitleg: "De klant heeft zich afgemeld ('stop'). Occapilot stuurt deze klant nooit meer een bericht." },
  { pill: "wait", label: "Gesloten", uitleg: "Jij hebt de lead handmatig gesloten (verkocht, niet doorgegaan). Alles blijft bewaard in het archief." },
];

const FAQ: { q: string; a: string }[] = [
  { q: "Kan de AI korting geven of iets toezeggen?", a: "Nee, nooit. Occapilot mag geen prijzen verlagen, geen garanties beloven en geen beschikbaarheid claimen. Bij een bod of prijsvraag draagt hij het gesprek direct aan jou over." },
  { q: "Waar haalt de AI zijn informatie vandaan?", a: "Alleen uit de advertentietekst van de lead en uit officiële RDW-voertuigdata (trekgewicht, APK-datum, kleur, tellerstandoordeel). Weet hij iets niet, dan zegt hij dat jij er persoonlijk op terugkomt. Hij verzint niets." },
  { q: "Wat gebeurt er als een klant boos wordt of iets juridisch aankaart?", a: "Occapilot reageert dan niet inhoudelijk, stuurt een korte neutrale bevestiging en escaleert direct naar jou, inclusief melding per e-mail met het telefoonnummer van de klant." },
  { q: "Kan ik zelf ingrijpen in een gesprek?", a: "Ja. Open de lead en klik op 'Sluit lead' om Occapilot te stoppen, of handel een escalatie af en klik op 'Afgehandeld, AI mag door' om de opvolging te hervatten." },
  { q: "Op welke tijden verstuurt Occapilot e-mails?", a: "Alleen tussen 08:00 en 20:30 (Nederlandse tijd). Opvolgmails die daarbuiten gepland staan, worden automatisch op het eerstvolgende nette moment verstuurd." },
  { q: "Kunnen klanten zich afmelden?", a: "Ja. Elke opvolgmail vanaf dag 3 bevat een afmeldregel. Antwoordt een klant 'stop', dan bevestigt Occapilot dat netjes en stopt alle communicatie permanent." },
  { q: "Wat als er meerdere leads op dezelfde auto binnenkomen?", a: "Occapilot herkent dat aan het kenteken, verhoogt de prioriteit, laat het zien in het overzicht ('X andere leads') en stuurt jou een melding zodat je die auto met voorrang kunt behandelen." },
];

export default async function Handleiding() {
  const dealer = (await currentDealer())!;
  const domain = process.env.INBOUND_DOMAIN || "…";
  return (
    <>
      <div className="pagehead">
        <div className="titles">
          <h1>Handleiding</h1>
          <span className="subtitle">Alles wat je moet weten, in 5 minuten leesbaar.</span>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 860 }}>
        <span className="cardtitle">Zo werkt Occapilot</span>
        <p className="note" style={{ margin: 0, fontSize: 13.5, lineHeight: 1.7 }}>
          Occapilot beantwoordt elke online autolead <b style={{ color: "var(--ink)" }}>binnen 2 minuten</b>, dag en nacht, en blijft
          vriendelijk opvolgen tot er een proefrit staat, of tot duidelijk is dat de klant afhaakt. Alles wat je hier ziet gebeurt
          automatisch; jij komt alleen in actie bij een <b style={{ color: "var(--red-ink)" }}>escalatie</b> of een{" "}
          <b style={{ color: "var(--green)" }}>bevestigde afspraak</b>.
        </p>
        <ol style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8, fontSize: 13.5, color: "var(--body)", lineHeight: 1.6 }}>
          <li><b style={{ color: "var(--ink)" }}>Lead komt binnen:</b> via het doorstuuradres hieronder, vanuit AutoScout24, AutoTrack, Marktplaats of je eigen website.</li>
          <li><b style={{ color: "var(--ink)" }}>Occapilot leest en verrijkt:</b> haalt klant, voertuig en vraag uit de mail en controleert het kenteken bij de RDW (trekgewicht, APK, kleur).</li>
          <li><b style={{ color: "var(--ink)" }}>Direct persoonlijk antwoord:</b> namens {dealer.seller_name}, met alleen geverifieerde informatie, en bij serieuze interesse meteen twee voorstelmomenten voor een proefrit.</li>
          <li><b style={{ color: "var(--ink)" }}>Slimme opvolging:</b> geen reactie? Dan volgt een vriendelijke herinnering na 1, 3 en 7 dagen. Reageert de klant, dan stopt de reeks en gaat het échte gesprek verder.</li>
          <li><b style={{ color: "var(--ink)" }}>Jij sluit de deal:</b> bij een afspraak of escalatie krijg je direct een e-mail. De complete gespreksgeschiedenis staat bij elke lead.</li>
        </ol>
      </div>

      <div className="card" style={{ maxWidth: 860 }}>
        <span className="cardtitle">Lead-instroom instellen</span>
        <p className="note" style={{ margin: 0, fontSize: 13.5, lineHeight: 1.7 }}>
          Stel in elk verkoopkanaal (of in je mailprogramma) een automatische doorsturing in van lead-notificaties naar:
        </p>
        <code style={{ fontSize: 14, color: "var(--ink)", background: "#f1f3fa", borderRadius: 10, padding: "10px 14px", width: "max-content", maxWidth: "100%" }}>
          leads-{dealer.inbound_token}@{domain}
        </code>
        <p className="note" style={{ margin: 0, fontSize: 13.5, lineHeight: 1.7 }}>
          <b style={{ color: "var(--ink)" }}>Tip:</b> in de meeste mailprogramma&apos;s (Outlook, Gmail) maak je hiervoor een regel aan: &quot;als afzender AutoScout24/AutoTrack/Marktplaats is → doorsturen naar bovenstaand adres&quot;. Dat is eenmalig 5 minuten werk per kanaal.
        </p>
      </div>

      <div className="card" style={{ maxWidth: 860 }}>
        <span className="cardtitle">Wat betekenen de statussen?</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {STATUSSEN.map((s) => (
            <div key={s.label} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <span className={`pill ${s.pill}`} style={{ flex: "none", minWidth: 150, textAlign: "center" }}>{s.label}</span>
              <span className="note" style={{ fontSize: 13, lineHeight: 1.6 }}>{s.uitleg}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ maxWidth: 860 }}>
        <span className="cardtitle">Wat doet de AI wél en niet?</span>
        <div className="detailgrid" style={{ gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <b style={{ fontSize: 13, color: "var(--green)" }}>✓ Doet Occapilot</b>
            {["Binnen 2 minuten reageren, ook 's avonds en in het weekend","Vragen beantwoorden met advertentie- en RDW-data","Proefritmomenten voorstellen binnen jouw openingstijden","Vriendelijk opvolgen na 1, 3 en 7 dagen","De aanspreekvorm van de klant spiegelen (je/u)","Escaleren zodra het spannend wordt"].map((t) => (
              <span key={t} className="note" style={{ fontSize: 13 }}>• {t}</span>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <b style={{ fontSize: 13, color: "var(--red-ink)" }}>✗ Doet Occapilot nooit</b>
            {["Korting geven of over de prijs onderhandelen","Inruilwaardes of financieringsbedragen noemen","Beschikbaarheid van de auto garanderen","Informatie verzinnen die nergens staat","Reageren op een boze klant of juridische kwestie","Mailen buiten 08:00–20:30 of na een afmelding"].map((t) => (
              <span key={t} className="note" style={{ fontSize: 13 }}>• {t}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 860 }}>
        <span className="cardtitle">Veelgestelde vragen</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {FAQ.map((f) => (
            <div key={f.q} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <b style={{ fontSize: 13.5, color: "var(--ink)" }}>{f.q}</b>
              <span className="note" style={{ fontSize: 13, lineHeight: 1.6 }}>{f.a}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
