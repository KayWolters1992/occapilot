import Link from "next/link";
import { currentDealer } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { Reveal, CountUp, ChannelTabs } from "./_lp/Interactive";

export const dynamic = "force-dynamic";

const FAQ = [
  { q: "Moet ik iets installeren of koppelen?", a: "Nee. Eén doorstuurregel in je mailbox per verkoopkanaal en je bent live. Geen koppeling met je voorraadsysteem nodig om te starten." },
  { q: "Wat merkt de klant ervan?", a: "Niets geks. Hij krijgt een persoonlijke e-mail namens jouw verkoper, vanaf jouw eigen e-mailadres. Snel, vriendelijk en inhoudelijk correct." },
  { q: "Kan de AI iets beloven wat niet klopt?", a: "Nee. Occapilot gebruikt alleen de advertentie en officiële RDW-data. Weet hij iets niet, dan zegt hij dat de verkoper er persoonlijk op terugkomt. Hij verzint niets." },
  { q: "Wat gebeurt er bij een bod of inruilvraag?", a: "Dan stopt de AI direct en krijg jij een melding. Onderhandelen, inruil en financiering blijven altijd jouw werk." },
  { q: "Kan ik zelf ingrijpen in een gesprek?", a: "Altijd. Elk gesprek staat woord voor woord in je dashboard. Je kunt meelezen, een lead sluiten of het gesprek overnemen." },
  { q: "Zit ik vast aan een contract?", a: "Nee. Geen jaarcontract en geen opstartkosten. Je betaalt per maand en zegt maandelijks op." },
  { q: "Voor wie is Occapilot bedoeld?", a: "Voor autobedrijven en occasiondealers in Nederland, van één vestiging tot dealergroepen. Geen technische kennis nodig." },
];

const LOG = [
  { t: "22:14", k: "Mark Jansen", a: "BMW 320i Touring", s: "AutoScout24", st: "hot", l: "Heet", dup: false },
  { t: "22:09", k: "Petra Willems", a: "Audi A4 Avant", s: "AutoScout24", st: "ai", l: "AI volgt op", dup: true },
  { t: "21:47", k: "Ahmed El Idrissi", a: "Audi A4 Avant", s: "Website", st: "ok", l: "Afspraak", dup: true },
  { t: "20:58", k: "Sanne de Vries", a: "VW Passat Variant", s: "Marktplaats", st: "esc", l: "Actie nodig", dup: false },
];

function Divider() {
  return <div className="x-div" aria-hidden="true"><i /></div>;
}

export default async function Landing() {
  const dealer = await currentDealer();
  const appLink = dealer ? "/leads" : "/registreren";
  const appLabel = dealer ? "Naar je dashboard" : "Gratis starten";

  return (
    <main className="x">
      {/* ── Topbar ── */}
      <header className="x-top">
        <Link href="/" className="x-logo"><Logo onDark markSize={36} wordHeight={19} /></Link>
        <nav className="x-nav">
          <a href="#omslag">Waarom</a>
          <a href="#kanalen">Kanalen</a>
          <a href="#functies">Functies</a>
          <a href="#prijs">Prijs</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="x-topcta">
          <Link href="/login" className="x-link">Inloggen</Link>
          <Link href={appLink} className="x-btn sm">{appLabel} →</Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="x-hero">
        <div className="x-hero-bg" aria-hidden="true" />
        <div className="x-hero-in">
          <div className="x-hero-copy">
            <span className="x-pill"><i className="x-dot" />Je tweede verkoper, 24/7 aan het werk</span>
            <h1>Wie het eerst antwoordt, verkoopt de auto. <em>Vanaf nu ben jij dat.</em></h1>
            <p>
              Occapilot is je tweede verkoper die nooit slaapt. Hij beantwoordt elke autolead binnen 2 minuten
              in jouw naam, ook om 23:00 en op zondag, en volgt dagenlang op tot de proefrit in de agenda staat.
              Bij een bod of inruilvraag geeft hij het gesprek direct aan jou.
            </p>
            <div className="x-ctas">
              <Link href="/registreren" className="x-btn">14 dagen gratis proberen →</Link>
              <a href="#kanalen" className="x-btn ghost">Bekijk live demo</a>
            </div>
            <span className="x-note">14 dagen gratis · geen jaarcontract · maandelijks opzegbaar</span>
          </div>

          <div className="x-flow">
            <div className="x-node top">
              <span className="x-node-ic">📨</span>
              <b>Nieuwe lead</b>
              <span>AutoScout24 · 22:14</span>
            </div>
            <svg className="x-wires" viewBox="0 0 600 130" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <linearGradient id="wg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="130">
                  <stop offset="0" stopColor="#8b5cf6" stopOpacity=".9" />
                  <stop offset="1" stopColor="#4f7cff" stopOpacity=".35" />
                </linearGradient>
              </defs>
              <path id="w1" d="M300 0 C300 70, 100 50, 100 130" />
              <path id="w2" d="M300 0 L300 130" />
              <path id="w3" d="M300 0 C300 70, 500 50, 500 130" />
              <circle r="4" className="pulse g"><animateMotion dur="2.4s" repeatCount="indefinite"><mpath href="#w1" /></animateMotion></circle>
              <circle r="4" className="pulse b"><animateMotion dur="2.4s" begin=".8s" repeatCount="indefinite"><mpath href="#w2" /></animateMotion></circle>
              <circle r="4" className="pulse a"><animateMotion dur="2.4s" begin="1.6s" repeatCount="indefinite"><mpath href="#w3" /></animateMotion></circle>
            </svg>
            <div className="x-nodes">
              <div className="x-node g">
                <span className="x-node-ic">✓</span>
                <b>Proefrit gepland</b>
                <span>za 11:00 · BMW 320i</span>
              </div>
              <div className="x-node b">
                <span className="x-node-ic">⚡</span>
                <b>AI antwoordt</b>
                <span>binnen 1 min 42</span>
              </div>
              <div className="x-node a">
                <span className="x-node-ic">!</span>
                <b>Naar verkoper</b>
                <span>bod op Passat</span>
              </div>
            </div>
          </div>
        </div>

        <div className="x-channels">
          <span>Werkt met</span>
          <b>AutoScout24</b><b>AutoTrack</b><b>Marktplaats</b><b>Eigen website</b>
        </div>
      </section>

      <Divider />

      {/* ── De omslag: zonder vs met ── */}
      <section className="x-sec" id="omslag">
        <Reveal>
          <div className="x-head center">
            <span className="x-kicker">De omslag</span>
            <h2>Je leads wachten. <em>Je concurrent niet.</em></h2>
            <p>
              De meeste leads komen binnen als jij geen tijd hebt: &apos;s avonds, in het weekend of midden in een drukke showroomdag.
              Wie het eerst antwoordt, krijgt de proefrit. <b>En wie de proefrit krijgt, verkoopt de auto.</b>
            </p>
          </div>
        </Reveal>
        <div className="x-vs">
          <Reveal className="x-card vs bad">
            <h3>Zonder Occapilot: <em>leads die blijven liggen</em></h3>
            <p className="x-muted">Leads blijven liggen tot iemand tijd heeft. Dan is de klant allang verder.</p>
            <ul className="x-list no">
              <li>Tot een derde van de online leads krijgt nooit antwoord</li>
              <li>Reactietijd van uren, vaak pas de volgende werkdag</li>
              <li>Geen opvolging als de klant niet meteen reageert</li>
              <li>Geen overzicht van welke lead heet is en welke niet</li>
            </ul>
            <div className="x-stat">
              <b><CountUp to={34} suffix="%" /></b>
              <span>van de online leads nooit beantwoord (onderzoek DCDW)</span>
              <div className="x-bar red"><i style={{ width: "34%" }} /></div>
            </div>
          </Reveal>
          <Reveal className="x-card vs good" delay={120}>
            <h3>Met Occapilot: <em>altijd als eerste</em></h3>
            <p className="x-muted">Elke lead krijgt direct een persoonlijk antwoord en wordt opgevolgd tot er een afspraak staat.</p>
            <ul className="x-list yes">
              <li>Antwoord binnen 2 minuten, 24/7, in jouw naam</li>
              <li>Feiten rechtstreeks uit de RDW, nooit verzonnen</li>
              <li>Opvolging na 1, 3 en 7 dagen als het stil blijft</li>
              <li>Elke lead gescoord: heet, warm of koud</li>
            </ul>
            <div className="x-stat">
              <b><CountUp to={100} suffix="%" /></b>
              <span>van je leads beantwoord, binnen 2 minuten</span>
              <div className="x-bar grad"><i style={{ width: "100%" }} /></div>
            </div>
          </Reveal>
        </div>
      </section>

      <Divider />

      {/* ── Kanalen: tabs + live mock ── */}
      <section className="x-sec" id="kanalen">
        <Reveal>
          <div className="x-head center">
            <span className="x-kicker">Live demo</span>
            <h2>Zo klinkt <em>je tweede verkoper</em></h2>
            <p>Kies een kanaal en kijk hoe Occapilot een lead beantwoordt: persoonlijk, feitelijk correct en binnen 2 minuten.</p>
          </div>
        </Reveal>
        <Reveal>
          <ChannelTabs />
        </Reveal>
      </section>

      <Divider />

      {/* ── Bento: functies ── */}
      <section className="x-sec" id="functies">
        <Reveal>
          <div className="x-head row">
            <div>
              <span className="x-kicker">Wat hij voor je doet</span>
              <h2>Niet alleen snel. <em>Ook slim.</em></h2>
              <p>Je tweede verkoper doet wat een goede verkoper doet: hij weet wie serieus is, checkt de feiten en roept jou op het juiste moment.</p>
            </div>
            <Link href="/registreren" className="x-textlink">Probeer het gratis →</Link>
          </div>
        </Reveal>

        <div className="x-bento">
          <Reveal className="x-card b-wide">
            <div className="x-card-head">
              <span className="x-ic">🔥</span>
              <span className="x-num">01 · Kwalificeren</span>
            </div>
            <h3>Weet welke lead heet is</h3>
            <p className="x-muted">Elke lead krijgt een score met de reden erbij. Jij ziet in één blik wie je vandaag moet bellen.</p>
            <div className="x-chart">
              <div className="x-chart-legend">
                <span className="x-lgd hot">Heet</span>
                <span className="x-lgd warm">Warm</span>
                <span className="x-lgd cold">Koud</span>
              </div>
              <div className="x-bars" aria-hidden="true">
                {[
                  [3, 5, 2], [4, 6, 3], [5, 5, 2], [6, 7, 3], [4, 6, 4], [7, 8, 3], [8, 7, 2],
                ].map((d, i) => (
                  <div className="x-col" key={i} style={{ animationDelay: `${i * 80}ms` }}>
                    <i className="hot" style={{ height: `${d[0] * 7}px` }} />
                    <i className="warm" style={{ height: `${d[1] * 7}px` }} />
                    <i className="cold" style={{ height: `${d[2] * 7}px` }} />
                    <span>{["ma", "di", "wo", "do", "vr", "za", "zo"][i]}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal className="x-card" delay={100}>
            <div className="x-card-head">
              <span className="x-ic">🇳🇱</span>
              <span className="x-num">02 · Verifiëren</span>
            </div>
            <h3>Checkt de feiten bij de RDW</h3>
            <p className="x-muted">Trekgewicht, APK en kleur komen live uit het register. Hij verzint nooit iets.</p>
            <div className="x-rdw">
              <div className="x-plate"><span>NL</span>K-123-XZ</div>
              <div className="x-rdw-rows">
                <div><span>Trekgewicht</span><b>1.600 kg ✓</b></div>
                <div><span>APK tot</span><b>03-2027 ✓</b></div>
                <div><span>Kleur</span><b>Grijs ✓</b></div>
              </div>
            </div>
          </Reveal>

          <Reveal className="x-card">
            <div className="x-card-head">
              <span className="x-ic">🛡️</span>
              <span className="x-num">03 · Overdragen</span>
            </div>
            <h3>Roept jou bij een bod</h3>
            <p className="x-muted">Korting, inruil en financiering blijven altijd jouw werk. Daar blijft hij vanaf.</p>
            <div className="x-guards">
              <span className="x-tag no">Korting geven</span>
              <span className="x-tag no">Bod accepteren</span>
              <span className="x-tag no">Inruilwaarde noemen</span>
            </div>
            <div className="x-alert">
              <span className="x-alert-ic">🔔</span>
              <div>
                <b>Actie nodig: bod op de Passat</b>
                <span>Sanne biedt € 17.500. Gesprek staat klaar voor jou.</span>
              </div>
            </div>
          </Reveal>

          <Reveal className="x-card b-wide" delay={100}>
            <div className="x-card-head">
              <span className="x-ic">📋</span>
              <span className="x-num">04 · Overzicht</span>
              <span className="x-live" style={{ marginLeft: "auto" }}><i />Live</span>
            </div>
            <h3>Alles in één dashboard</h3>
            <p className="x-muted">Elk gesprek woord voor woord. Twee kandidaten op dezelfde auto? Dan zie je dat meteen.</p>
            <div className="x-log">
              {LOG.map((r, i) => (
                <div className="x-log-row" key={r.k} style={{ animationDelay: `${i * 120}ms` }}>
                  <span className="t">{r.t}</span>
                  <span className="k"><b>{r.k}</b>{r.a}</span>
                  <span className="s">{r.dup ? <span className="x-dup">2 kandidaten</span> : r.s}</span>
                  <span className={`x-tag ${r.st}`}>{r.l}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <Divider />

      {/* ── Setup ── */}
      <section className="x-sec">
        <div className="x-setup">
          <Reveal>
            <span className="x-kicker">Easy setup</span>
            <h2 className="x-big">Vanmiddag ingesteld. <em>Vanavond aan het werk.</em></h2>
            <p className="x-muted lg">
              Geen koppelingen, geen installatie, geen jaarcontract. Eén doorstuurregel in je mailbox
              en je tweede verkoper begint aan zijn eerste dienst.
            </p>
            <div className="x-legend">
              <span><i className="g" />Geen installatie</span>
              <span><i className="b" />Geen jaarcontract</span>
              <span><i className="a" />Vandaag live</span>
            </div>
          </Reveal>
          <div className="x-tiles">
            {[
              { n: "1", ic: "📨", t: "Doorsturen", s: "Eén regel in je mailbox stuurt lead-mails naar jouw Occapilot-adres." },
              { n: "2", ic: "⚡", t: "AI antwoordt", s: "Binnen 2 minuten een persoonlijk antwoord met RDW-feiten." },
              { n: "3", ic: "🔁", t: "Opvolging", s: "Herinneringen na 1, 3 en 7 dagen tot er een afspraak staat." },
              { n: "4", ic: "🤝", t: "Jij verkoopt", s: "Proefrit gepland? Dan krijg jij een melding. De deal is aan jou." },
            ].map((s, i) => (
              <Reveal className="x-tile" key={s.t} delay={i * 90}>
                <div className="x-tile-top"><span className="x-ic sm">{s.ic}</span><span className="x-n">{s.n}</span></div>
                <b>{s.t}</b>
                <span>{s.s}</span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ── Prijs ── */}
      <section className="x-sec" id="prijs">
        <Reveal>
          <div className="x-head center">
            <span className="x-kicker">Prijs</span>
            <h2>Goedkoper dan <em>één gemiste verkoop.</em></h2>
            <p>Verkoop je één extra occasion per half jaar, dan heeft Occapilot zichzelf al terugverdiend.</p>
          </div>
        </Reveal>
        <Reveal>
          <div className="x-price">
            <div className="x-price-l">
              <span className="x-pill"><i className="x-dot" />Introductieprijs</span>
              <div className="x-amount">€ 199<small>/ maand per vestiging</small></div>
              <span className="x-muted">Eerste 14 dagen gratis · maandelijks opzegbaar</span>
              <Link href="/registreren" className="x-btn">Start je proefperiode →</Link>
            </div>
            <ul className="x-list yes">
              <li>Onbeperkt aantal leads en gesprekken</li>
              <li>Alle kanalen: AutoScout24, AutoTrack, Marktplaats, eigen website</li>
              <li>RDW-verrijking, kwalificatie en escalaties</li>
              <li>Volledige gesprekslog in je dashboard</li>
              <li>Geen setup-kosten en geen jaarcontract</li>
            </ul>
          </div>
        </Reveal>
      </section>

      <Divider />

      {/* ── FAQ ── */}
      <section className="x-sec narrow" id="faq">
        <Reveal>
          <div className="x-head center">
            <span className="x-kicker">FAQ</span>
            <h2>Veelgestelde vragen</h2>
          </div>
        </Reveal>
        <div className="x-faq">
          {FAQ.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Slot-CTA ── */}
      <section className="x-final">
        <div className="x-final-glow" aria-hidden="true" />
        <span className="x-kicker">14 dagen gratis</span>
        <h2>Laat vanavond geen enkele lead <em>meer liggen.</em></h2>
        <p className="x-muted lg">14 dagen gratis · geen creditcard · geen jaarcontract</p>
        <div className="x-ctas center">
          <Link href="/registreren" className="x-btn">Gratis starten →</Link>
          <Link href="/login" className="x-btn ghost">Inloggen</Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="x-foot">
        <div className="x-foot-grid">
          <div className="x-foot-brand">
            <Logo onDark markSize={30} wordHeight={16} />
            <p>Je tweede verkoper die nooit slaapt. Elke online autolead beantwoord en opgevolgd tot er een proefrit staat.</p>
          </div>
          <div>
            <span>Product</span>
            <a href="#omslag">Waarom Occapilot</a>
            <a href="#kanalen">Live demo</a>
            <a href="#functies">Functies</a>
            <a href="#prijs">Prijs</a>
          </div>
          <div>
            <span>Account</span>
            <Link href="/registreren">Gratis starten</Link>
            <Link href="/login">Inloggen</Link>
          </div>
          <div>
            <span>Support</span>
            <a href="#faq">FAQ</a>
            <a href="mailto:hallo@occapilot.nl">hallo@occapilot.nl</a>
          </div>
        </div>
        <div className="x-foot-bottom">© {new Date().getFullYear()} Occapilot · Alle rechten voorbehouden</div>
      </footer>
    </main>
  );
}
