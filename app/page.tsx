import Link from "next/link";
import { currentDealer } from "@/lib/auth";
import { Logo } from "@/components/Logo";

export const dynamic = "force-dynamic";

const STEPS = [
  { t: "Stuur je leads door", s: "Eén doorstuurregel in je mailbox: lead-mails van AutoScout24, AutoTrack, Marktplaats en je website gaan automatisch naar jouw Occapilot-adres." },
  { t: "Occapilot antwoordt binnen 2 minuten", s: "Persoonlijk, in jouw naam, met alleen geverifieerde informatie uit de advertentie en officiële RDW-data. Ook om 22:00 en op zondag." },
  { t: "Slimme opvolging tot er een afspraak staat", s: "Geen reactie? Vriendelijke herinnering na 1, 3 en 7 dagen. Reageert de klant, dan voert Occapilot het gesprek — tot de proefrit is ingepland." },
  { t: "Jij sluit de deal", s: "Bij een afspraak of een gesprek dat om jou vraagt (bod, inruil, klacht) krijg je direct een melding. Jij doet alleen nog het leukste deel." },
];

const FEATS = [
  { t: "🇳🇱 RDW-geverifieerde antwoorden", s: "Trekgewicht, APK-vervaldatum, kleur en tellerstandoordeel worden live bij de RDW opgehaald. Geen gegok — de klant krijgt officiële data." },
  { t: "🔥 Automatische leadkwalificatie", s: "Elke lead wordt gescoord als heet, warm of koud, met de reden erbij. Zo zie je in één oogopslag waar je aandacht naartoe moet." },
  { t: "👀 Meerdere leads, één auto", s: "Twee kandidaten op dezelfde occasion? Occapilot herkent het aan het kenteken, verhoogt de prioriteit en waarschuwt je direct." },
  { t: "🛡️ Harde vangrails", s: "Geen kortingen, geen toezeggingen, geen verzonnen antwoorden. Bij een bod, inruilvraag of boze klant draagt de AI het gesprek meteen aan jou over." },
  { t: "✉️ Nette opvolgreeks", s: "Herinneringen alleen tussen 08:00 en 20:30, altijd met afmeldmogelijkheid. Antwoordt een klant 'stop', dan stopt écht alles." },
  { t: "📋 Volledig gelogd", s: "Elk gesprek staat woord voor woord in je dashboard. Jij en je collega's kunnen elk moment meelezen of het overnemen." },
];

const FAQ = [
  { q: "Moet ik iets installeren of koppelen?", a: "Nee. Occapilot werkt via e-mail-doorsturing — één regel instellen in je mailbox per verkoopkanaal en je bent live. Geen koppelingen met je voorraadsysteem nodig om te starten." },
  { q: "Wat merkt de klant ervan?", a: "De klant krijgt gewoon een persoonlijke e-mail namens jouw verkoper, vanaf jouw eigen e-mailadres. Snel, vriendelijk en inhoudelijk correct." },
  { q: "Kan de AI iets beloven wat niet klopt?", a: "Nee. Occapilot mag alleen informatie gebruiken uit de advertentie en de officiële RDW-data. Weet hij iets niet, dan zegt hij dat de verkoper er persoonlijk op terugkomt." },
  { q: "Voor wie is dit bedoeld?", a: "Voor universele autobedrijven en occasiondealers in Nederland — van 1 vestiging tot dealergroepen. Geen technische kennis nodig." },
];

export default async function Landing() {
  const dealer = await currentDealer();
  const appLink = dealer ? "/leads" : "/registreren";
  const appLabel = dealer ? "Naar je dashboard" : "Gratis starten";

  return (
    <main className="lp">
      <div className="lp-topbar">
        <span className="logo"><Logo onDark markSize={40} wordHeight={21} /></span>
        <div className="links">
          <a href="#hoe">Hoe het werkt</a>
          <a href="#features">Functies</a>
          <a href="#prijs">Prijs</a>
          <Link href="/login">Inloggen</Link>
          <Link href={appLink} className="btn small">{appLabel}</Link>
        </div>
      </div>

      <section className="lp-hero">
        <div className="heroin">
          <span className="lp-badge">⚡ De snelste autoverkoper die je bedrijf ooit heeft gehad</span>
          <h1>Nooit meer een lead verliezen aan de <em>concurrent om de hoek.</em></h1>
          <p>
            Elke lead beantwoord binnen 2 minuten. Persoonlijk, feilloos en 24/7 — ook om 23:00 en op zondag,
            wanneer jouw concurrentie allang slaapt. Occapilot voert het hele gesprek in jouw naam,
            tot de proefrit in de agenda staat.
          </p>
          <div className="lp-cta">
            <Link href="/registreren" className="btn">Gratis starten — klaar in 2 minuten</Link>
            <a href="#hoe" className="ghostbtn">Bekijk hoe het werkt</a>
          </div>
          <span className="lp-note">14 dagen gratis proberen · geen creditcard nodig · maandelijks opzegbaar</span>
        </div>
        <div className="lp-showcase">
          <div className="lp-window">
            <div className="bar">
              <span className="dots"><i /><i /><i /></span>
              <span className="url">app.occapilot.nl</span>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/dashboard-preview.png" alt="Het Occapilot-leadoverzicht met gekwalificeerde leads, kentekens en statussen" />
          </div>
          <div className="float-card ok">
            <span className="t">✓ Afspraak bevestigd</span>
            <span className="s">Proefrit za 11:00 · Audi A4 Avant</span>
          </div>
          <div className="float-card kpi">
            <span className="s">Reactietijd</span>
            <span className="t">1 min 42 sec</span>
          </div>
        </div>
      </section>

      <section className="lp-section">
        <span className="lp-kicker">Het probleem</span>
        <h2>Elke minuut stilte kost je een verkoop</h2>
        <p className="lp-lead">
          &apos;s Avonds, in het weekend, of midden in een drukke showroomdag — precies wanneer jij geen tijd hebt,
          komen de beste leads binnen. En reactiesnelheid is het enige dat écht bepaalt wie de auto verkoopt.
        </p>
        <div className="lp-stats">
          <div className="lp-stat"><span className="ic">📉</span><b>25–34%</b><span>van de online leads bij autobedrijven wordt nooit beantwoord (onderzoek DCDW)</span></div>
          <div className="lp-stat"><span className="ic">⚡</span><b>&lt; 2 min</b><span>reactietijd van Occapilot — op elk uur van de dag, elke dag van het jaar</span></div>
          <div className="lp-stat"><span className="ic">🔁</span><b>1-3-7</b><span>dagen: automatische, vriendelijke opvolging zolang de klant nog niet reageert</span></div>
          <div className="lp-stat"><span className="ic">💰</span><b>€ 1.200+</b><span>gemiddelde marge per extra verkochte occasion — één geredde lead per maand betaalt de tool ruimschoots terug</span></div>
        </div>
      </section>

      <section className="lp-section wide" id="hoe">
        <div>
          <span className="lp-kicker">Hoe het werkt</span>
          <h2>Live in één middag, zonder technische kennis</h2>
          <div className="lp-steps">
            {STEPS.map((s, i) => (
              <div className="lp-step" key={s.t}>
                <i>{i + 1}</i>
                <b>{s.t}</b>
                <span>{s.s}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section" id="features">
        <span className="lp-kicker">Functies</span>
        <h2>Gebouwd om de concurrentie te verpletteren</h2>
        <div className="lp-feats">
          {FEATS.map((f) => (
            <div className="lp-feat" key={f.t}>
              <b>{f.t}</b>
              <span>{f.s}</span>
            </div>
          ))}
        </div>
        <div className="lp-nooit">
          <div>
            <h3>Wat Occapilot nooit doet</h3>
            <ul>
              <li>Korting geven of over prijs onderhandelen</li>
              <li>Inruilwaardes of financieringsbedragen noemen</li>
              <li>Beschikbaarheid garanderen of informatie verzinnen</li>
            </ul>
          </div>
          <div>
            <h3>Wanneer jij het overneemt</h3>
            <ul>
              <li>Bij een bod, inruil- of financieringsvraag</li>
              <li>Bij een ontevreden klant of juridische kwestie</li>
              <li>Zodra de proefrit staat — verkopen doe jij</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="lp-section wide" id="prijs">
        <div>
          <span className="lp-kicker">Prijs</span>
          <h2>Eén duidelijke prijs. Geen verrassingen.</h2>
          <div className="lp-price">
            <div>
              <div className="amount">€ 199 <small>/ maand per vestiging</small></div>
              <span className="lp-note" style={{ color: "var(--muted)" }}>Introductieprijs · eerste 14 dagen gratis</span>
            </div>
            <ul>
              <li>✓ Onbeperkt aantal leads en gesprekken</li>
              <li>✓ Alle kanalen: AutoScout24, AutoTrack, Marktplaats, eigen website</li>
              <li>✓ RDW-verrijking, kwalificatie en escalaties inbegrepen</li>
              <li>✓ Geen setup-kosten, maandelijks opzegbaar</li>
            </ul>
            <Link href="/registreren" className="btn" style={{ marginLeft: "auto" }}>Start je proefperiode</Link>
          </div>
        </div>
      </section>

      <section className="lp-section">
        <span className="lp-kicker">Veelgestelde vragen</span>
        <h2>Nog even helder</h2>
        <div className="lp-faq">
          {FAQ.map((f) => (
            <div key={f.q}>
              <b>{f.q}</b>
              <span>{f.a}</span>
            </div>
          ))}
        </div>
      </section>

      <footer className="lp-footer">
        <h2>Klaar om elke lead razendsnel te beantwoorden?</h2>
        <div className="lp-cta" style={{ justifyContent: "center" }}>
          <Link href="/registreren" className="btn">Gratis starten</Link>
          <Link href="/login" className="ghostbtn">Inloggen</Link>
        </div>
        <span className="fine">© {new Date().getFullYear()} Occapilot · Elke online lead beantwoord en opgevolgd tot er een proefrit staat.</span>
      </footer>
    </main>
  );
}
