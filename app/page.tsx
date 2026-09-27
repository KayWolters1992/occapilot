import Link from "next/link";
import { currentDealer } from "@/lib/auth";
import { Logo } from "@/components/Logo";

export const dynamic = "force-dynamic";

const STEPS = [
  { ic: "📨", t: "Eén regel instellen", s: "Lead-mails van AutoScout24, AutoTrack, Marktplaats en je website stuur je automatisch door naar jouw Occapilot-adres. Klaar in vijf minuten." },
  { ic: "⚡", t: "Binnen 2 minuten antwoord", s: "Persoonlijk, in jouw naam, met alleen geverifieerde informatie uit de advertentie en officiële RDW-data. Ook om 22:00 en op zondag." },
  { ic: "🔁", t: "Opvolging die niet loslaat", s: "Geen reactie? Vriendelijke herinnering na 1, 3 en 7 dagen. Reageert de klant, dan voert Occapilot het gesprek door tot de proefrit is ingepland." },
  { ic: "🤝", t: "Jij sluit de deal", s: "Bij een afspraak of een gesprek dat om jou vraagt, krijg je meteen een melding. Jij doet alleen nog het leukste deel: verkopen." },
];

const FEATS = [
  { t: "🇳🇱 RDW-geverifieerde antwoorden", s: "Trekgewicht, APK-vervaldatum, kleur en tellerstandoordeel worden live bij de RDW opgehaald. Geen gegok. De klant krijgt officiële data." },
  { t: "🔥 Automatische leadkwalificatie", s: "Elke lead wordt gescoord als heet, warm of koud, met de reden erbij. Zo zie je in één oogopslag waar je aandacht naartoe moet." },
  { t: "👀 Meerdere leads, één auto", s: "Twee kandidaten op dezelfde occasion? Occapilot herkent het aan het kenteken, verhoogt de prioriteit en waarschuwt je direct." },
  { t: "🛡️ Harde vangrails", s: "Geen kortingen, geen toezeggingen, geen verzonnen antwoorden. Bij een bod, inruilvraag of boze klant draagt de AI het gesprek meteen aan jou over." },
  { t: "✉️ Nette opvolgreeks", s: "Herinneringen alleen tussen 08:00 en 20:30, altijd met afmeldmogelijkheid. Antwoordt een klant 'stop', dan stopt écht alles." },
  { t: "📋 Volledig gelogd", s: "Elk gesprek staat woord voor woord in je dashboard. Jij en je collega's kunnen elk moment meelezen of het overnemen." },
];

const FAQ = [
  { q: "Moet ik iets installeren of koppelen?", a: "Nee. Eén regel instellen in je mailbox per verkoopkanaal en je bent live. Geen koppelingen met je voorraadsysteem nodig om te starten." },
  { q: "Wat merkt de klant ervan?", a: "Niets geks. Gewoon een persoonlijke e-mail namens jouw verkoper, vanaf jouw eigen e-mailadres. Snel, vriendelijk en inhoudelijk correct." },
  { q: "Kan de AI iets beloven wat niet klopt?", a: "Nee. Occapilot mag alleen informatie gebruiken uit de advertentie en de officiële RDW-data. Weet hij iets niet, dan zegt hij dat de verkoper er persoonlijk op terugkomt." },
  { q: "Voor wie is dit bedoeld?", a: "Voor universele autobedrijven en occasiondealers in Nederland, van één vestiging tot dealergroepen. Geen technische kennis nodig." },
];

const CHANNELS = ["AutoScout24", "AutoTrack", "Marktplaats", "Eigen website"];

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
          <h1>Terwijl jij slaapt, <em>verkoopt Occapilot door.</em></h1>
          <p>
            Elke lead persoonlijk beantwoord binnen 2 minuten. Feilloos en altijd aan, ook om 23:00 en op zondag,
            precies wanneer je concurrent nog ligt te slapen. Occapilot voert het hele gesprek in jouw naam,
            tot de proefrit in de agenda staat.
          </p>
          <div className="lp-cta">
            <Link href="/registreren" className="btn">Gratis starten · klaar in 2 minuten</Link>
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

      <section className="lp-channels">
        <span className="ch-label">Werkt met de kanalen die je al gebruikt</span>
        <div className="ch-tiles">
          {CHANNELS.map((c) => (
            <span className="ch-tile" key={c}>{c}</span>
          ))}
        </div>
      </section>

      <section className="lp-section">
        <span className="lp-kicker">Zonder vs. met Occapilot</span>
        <h2>Wat verandert er echt voor jouw showroom?</h2>
        <p className="lp-lead">
          &apos;s Avonds, in het weekend, of midden in een drukke showroomdag: precies wanneer jij geen tijd hebt,
          komen de beste leads binnen. Reactiesnelheid is het enige dat écht bepaalt wie de auto verkoopt.
        </p>

        <div className="lp-vs">
          <div className="vs-col bad">
            <span className="vs-label">Zonder Occapilot</span>
            <div className="vs-stat">25<span>&ndash;</span>34%</div>
            <ul>
              <li>van de leads krijgt nooit een antwoord (onderzoek DCDW)</li>
              <li>reactietijd van uren, soms pas de volgende dag</li>
              <li>een gemiste lead is een auto die bij de buurman wordt gekocht</li>
            </ul>
          </div>
          <div className="vs-arrow" aria-hidden="true">→</div>
          <div className="vs-col good">
            <span className="vs-label">Met Occapilot</span>
            <div className="vs-stat">&lt; 2 min</div>
            <ul>
              <li>elke lead krijgt altijd een persoonlijk antwoord</li>
              <li>opvolging na 1, 3 en 7 dagen, volledig automatisch</li>
              <li>één geredde lead betaalt de tool die maand al terug (€ 1.200+ marge)</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="lp-section wide" id="hoe">
        <div>
          <span className="lp-kicker">Hoe het werkt</span>
          <h2>Hoe sta jij hier vanmiddag al mee live?</h2>
          <div className="lp-steps">
            {STEPS.map((s, i) => (
              <div className="lp-step" key={s.t}>
                <div className="stepnum"><i>{i + 1}</i><span className="stepic">{s.ic}</span></div>
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
          <span className="lp-nooit-kicker">De belofte</span>
          <h3 className="lp-nooit-h">Andere AI-tools verzinnen liever een antwoord dan dat ze "ik weet het niet" zeggen. Occapilot niet.</h3>
          <div className="lp-nooit-grid">
            <div className="nooit-col no">
              <span className="nooit-label">✕ Occapilot doet dit nooit</span>
              <ul>
                <li>Korting geven of over de prijs onderhandelen</li>
                <li>Inruilwaardes of financieringsbedragen noemen</li>
                <li>Beschikbaarheid garanderen of informatie verzinnen</li>
              </ul>
            </div>
            <div className="nooit-col yes">
              <span className="nooit-label">→ Jij neemt het over</span>
              <ul>
                <li>Bij een bod, inruil- of financieringsvraag</li>
                <li>Bij een ontevreden klant of juridische kwestie</li>
                <li>Zodra de proefrit staat: verkopen doe jij</li>
              </ul>
            </div>
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

      <section className="lp-final">
        <h2>Klaar om elke lead razendsnel te beantwoorden?</h2>
        <div className="lp-cta" style={{ justifyContent: "center" }}>
          <Link href="/registreren" className="btn">Gratis starten</Link>
          <Link href="/login" className="ghostbtn">Inloggen</Link>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-footer-grid">
          <div className="lp-footer-brand">
            <Logo onDark markSize={30} wordHeight={16} />
            <p>Elke online autolead beantwoord en opgevolgd tot er een proefrit staat. Gebouwd voor Nederlandse autobedrijven.</p>
          </div>
          <div>
            <span className="fcol-title">Product</span>
            <a href="#hoe">Hoe het werkt</a>
            <a href="#features">Functies</a>
            <a href="#prijs">Prijs</a>
          </div>
          <div>
            <span className="fcol-title">Account</span>
            <Link href="/registreren">Gratis starten</Link>
            <Link href="/login">Inloggen</Link>
          </div>
          <div>
            <span className="fcol-title">Contact</span>
            <a href="mailto:hallo@occapilot.nl">hallo@occapilot.nl</a>
          </div>
        </div>
        <div className="lp-footer-bottom">
          <span className="fine">© {new Date().getFullYear()} Occapilot</span>
        </div>
      </footer>
    </main>
  );
}
