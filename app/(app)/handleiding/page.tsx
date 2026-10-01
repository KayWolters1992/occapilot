import { Ic } from "@/components/Ic";
import Link from "next/link";
import { currentDealer } from "@/lib/auth";
import { LANES, statusInfo } from "@/lib/status";
import { StatusPill } from "@/components/StatusPill";
import { InboundAddress, TestLeadButton } from "../leads/OnboardingCard";

export const dynamic = "force-dynamic";

const OVERDRACHT = [
  { ic: "💶", t: "De klant wil onderhandelen", s: "\"Kan er nog wat van de prijs af?\" Over geld beslis jij." },
  { ic: "🔁", t: "De klant wil zijn auto inruilen", s: "RepRight vraagt het kenteken en de kilometerstand. De prijs noem jij." },
  { ic: "🏦", t: "Financiering of lease", s: "Bedragen en voorwaarden bespreek jij met de klant." },
  { ic: "😠", t: "De klant is ontevreden", s: "RepRight blijft rustig en geeft het meteen aan jou." },
  { ic: "⚖️", t: "Garantie of een klacht", s: "Alles wat juridisch is, gaat altijd naar jou." },
  { ic: "❓", t: "RepRight weet het antwoord niet", s: "Hij verzint nooit iets. Dan vraagt hij het aan jou." },
  { ic: "📅", t: "Het gekozen moment is al bezet", s: "Twee klanten tegelijk? Nooit. Dan kies jij samen met de klant een ander moment." },
];

const FAQ: { q: string; a: string }[] = [
  { q: "Merkt de klant dat hij met een computer praat?", a: "De berichten gaan uit jouw naam en zijn persoonlijk geschreven, in dezelfde toon als de klant (je of u). Vraagt de klant er rechtstreeks naar, dan is RepRight daar eerlijk over." },
  { q: "Kan RepRight korting geven of iets beloven?", a: "Nee. RepRight verlaagt nooit de prijs, belooft geen garantie en zegt niets wat jij niet zelf hebt gezegd. Vraagt een klant om korting, dan krijg jij het gesprek." },
  { q: "Waar haalt RepRight zijn informatie vandaan?", a: "Uit twee plekken: de advertentie waar de klant op reageerde, en de officiële gegevens van de RDW (bijvoorbeeld trekgewicht, APK en kleur). Staat het daar niet in, dan zegt hij dat niet zomaar iets." },
  { q: "Weet RepRight of een auto nog te koop is?", a: "Dat stel je zelf in bij Instellingen. Haal je verkochte auto's altijd snel offline? Laat het vinkje dan aan: RepRight zegt dan \"ja, hij staat nog te koop\" en plant meteen een proefrit. Zet je het vinkje uit, dan geeft RepRight die vraag aan jou en bevestig jij het zelf." },
  { q: "Hoe weet ik dat iets op mij wacht?", a: "Op drie manieren: je krijgt een e-mail, het rode getal bij Leads in het menu gaat omhoog, en op het dashboard staat de lead bovenaan bij Vandaag bellen." },
  { q: "Kunnen er twee proefritten op hetzelfde moment komen?", a: "Nee. RepRight weet welke tijden al geboekt zijn en stelt die nooit voor. Kiest een klant toch een bezet moment, dan bevestigt RepRight het niet en geeft hij het aan jou. Leg je zelf een afspraak vast op een bezet moment, dan krijg je een waarschuwing." },
  { q: "Wat als ik een klant zelf bel en een afspraak maak?", a: "Open de lead en klik op 'Afspraak gemaakt'. Vul dag en tijd in. RepRight stopt dan met opvolgen, zet de proefrit in je agenda en stuurt de klant de dag ervoor een herinnering." },
  { q: "Hoe laat stuurt RepRight berichten?", a: "Het eerste antwoord gaat meteen, ook 's nachts, want een snelle reactie verkoopt. Herinneringen gaan alleen overdag, tussen 08:00 en 20:30." },
  { q: "Wat als een klant geen berichten meer wil?", a: "Stuurt de klant \"stop\", dan bevestigt RepRight dat netjes en stuurt hij deze klant nooit meer iets." },
  { q: "Wat als meerdere mensen op dezelfde auto reageren?", a: "RepRight herkent dat aan het kenteken. Je ziet dan \"👀 andere lead(s) op deze auto\" in het overzicht. Zo weet je dat die auto populair is." },
  { q: "Kan ik iets fout doen?", a: "Nauwelijks. Een gesloten lead kun je weer openen, en een lead die je hebt overgenomen kun je altijd teruggeven aan RepRight." },
];

export default async function Handleiding() {
  const dealer = (await currentDealer())!;
  const domain = process.env.INBOUND_DOMAIN || "…";
  const inbound = `leads-${dealer.inbound_token}@${domain}`;
  const toc = [
    ["wat", "Wat doet RepRight?"], ["jij", "Wat doe jij?"], ["instellen", "Eenmalig instellen"],
    ["dashboard", "Het dashboard"], ["lead", "Een lead openen"], ["overdracht", "Wanneer krijg jij het?"], ["vragen", "Vragen"],
  ];

  return (
    <>
      <div className="pagehead">
        <div className="titles">
          <h1>Hulp & <em>uitleg</em></h1>
          <span className="subtitle">Alles over RepRight in gewone taal. Lees het in 5 minuten van boven naar beneden, of klik op een onderwerp.</span>
        </div>
      </div>

      <nav className="toc">
        {toc.map(([id, t]) => <a key={id} href={`#${id}`}>{t}</a>)}
      </nav>

      {/* 1 ─ Wat doet RepRight */}
      <section className="card hulp" id="wat">
        <span className="hulp-n">01</span>
        <h2>Wat doet RepRight voor je?</h2>
        <p className="hulp-lead">
          RepRight is een <b>extra verkoper</b> die nooit slaapt. Reageert iemand online op een van je auto&apos;s, dan stuurt
          RepRight <b>binnen 2 minuten</b> een persoonlijk antwoord. Dat antwoord gaat uit <b>jouw naam</b>, ook &apos;s avonds en in het weekend.
        </p>
        <p className="hulp-lead">Zo gaat het met elke lead:</p>
        <div className="dag four">
          <div><span className="dag-ic">📨</span><b>1. De klant stelt een vraag</b><span>Via AutoScout24, AutoTrack, Marktplaats of je eigen website.</span></div>
          <div><span className="dag-ic">⚡</span><b>2. RepRight antwoordt</b><span>Binnen 2 minuten, met twee momenten voor een proefrit.</span></div>
          <div><span className="dag-ic">🔁</span><b>3. RepRight blijft opvolgen</b><span>Hoort hij niets? Dan stuurt hij vriendelijke herinneringen. Ook als het gesprek later stilvalt.</span></div>
          <div className="ok"><span className="dag-ic">✓</span><b>4. De proefrit staat</b><span>Met dag en tijd in je agenda. De klant krijgt de dag ervoor een herinnering.</span></div>
        </div>
        <p className="hulp-lead">
          Wordt het te lastig voor een computer, zoals een bod of een inruilvraag? Dan <b>stopt RepRight en geeft hij het aan jou</b>.
          Jij doet dus alleen nog het echte verkoopwerk.
        </p>
      </section>

      {/* 2 ─ Wat doe jij */}
      <section className="card hulp" id="jij">
        <span className="hulp-n">02</span>
        <h2>Wat moet jij doen?</h2>
        <p className="hulp-lead">Heel weinig. Eigenlijk maar drie dingen:</p>
        <div className="todo">
          <div><span className="todo-n">1</span><div><b>Kijk elke ochtend even op het dashboard</b><span>Bovenaan zie je in één oogopslag of er iets op jou wacht.</span></div></div>
          <div><span className="todo-n">2</span><div><b>Bel of mail de klanten die op jou wachten</b><span>Die staan bij <em>Vandaag bellen</em> met het label <em>Moet</em>. Je krijgt er ook een e-mail over.</span></div></div>
          <div><span className="todo-n">3</span><div><b>Zet de auto klaar voor de proefritten</b><span>Je ziet ze op datum onder <em>Proefritten</em> in het menu. De klant krijgt de dag ervoor automatisch een herinnering.</span></div></div>
        </div>
        <p className="hulp-lead">
          <b>Al het andere doet RepRight.</b> Staat een lead bij &quot;RepRight is bezig&quot;, dan hoef je er niets mee.
        </p>
      </section>

      {/* 3 ─ Instellen */}
      <section className="card hulp" id="instellen">
        <span className="hulp-n">03</span>
        <h2>Eenmalig instellen (ongeveer 10 minuten)</h2>
        <p className="hulp-lead">Dit doe je één keer. Daarna werkt RepRight vanzelf.</p>

        <div className="stap">
          <span className="stap-n">1</span>
          <div>
            <b>Controleer je gegevens</b>
            <span>Ga naar <Link href="/instellingen">Instellingen</Link> en kijk of je bedrijfsnaam en je eigen naam kloppen. RepRight ondertekent elk bericht met deze naam.</span>
          </div>
        </div>
        <div className="stap">
          <span className="stap-n">2</span>
          <div>
            <b>Vul je proefritrooster in</b>
            <span>Onder <Link href="/instellingen#rooster">Proefritrooster</Link> zet je per dag of je open bent en van hoe laat tot hoe laat. RepRight stelt klanten alleen tijden voor die daarin passen.</span>
          </div>
        </div>
        <div className="stap">
          <span className="stap-n">3</span>
          <div>
            <b>Stuur je lead-mails door naar RepRight</b>
            <span>
              Nu krijg je mails van AutoScout24, AutoTrack en Marktplaats in je eigen mailbox. Die laat je voortaan automatisch
              doorsturen naar jouw persoonlijke RepRight-adres. Kopieer dit adres:
            </span>
            <InboundAddress address={inbound} />
            <div className="howto">
              <div>
                <b>Gebruik je Outlook?</b>
                <ol>
                  <li>Klik rechtsboven op het tandwiel en kies <em>E-mail</em> en daarna <em>Regels</em>.</li>
                  <li>Klik op <em>Nieuwe regel</em>. Kies als voorwaarde: afzender bevat <code>autoscout24</code>.</li>
                  <li>Kies als actie: <em>Doorsturen naar</em> en plak je RepRight-adres. Klik op Opslaan.</li>
                  <li>Doe hetzelfde voor <code>autotrack</code> en <code>marktplaats</code>.</li>
                </ol>
              </div>
              <div>
                <b>Gebruik je Gmail?</b>
                <ol>
                  <li>Klik op het tandwiel en kies <em>Alle instellingen bekijken</em>.</li>
                  <li>Open het tabblad <em>Doorsturen en POP/IMAP</em> en voeg je RepRight-adres toe.</li>
                  <li>Maak een filter: van <code>autoscout24</code>, en kies <em>Doorsturen naar</em> je RepRight-adres.</li>
                  <li>Doe hetzelfde voor <code>autotrack</code> en <code>marktplaats</code>.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
        <div className="stap">
          <span className="stap-n">4</span>
          <div>
            <b>Test of het werkt</b>
            <span>Klik op de knop hieronder. Je ziet dan precies wat er gebeurt als er een echte lead binnenkomt.</span>
            <div><TestLeadButton /></div>
          </div>
        </div>
        <p className="note" style={{ margin: 0 }}>
          Kom je er niet uit? Mail <a href="mailto:hallo@repright.ai">hallo@repright.ai</a>. Dan stellen we het samen met je in.
        </p>
      </section>

      {/* 4 ─ Dashboard */}
      <section className="card hulp" id="dashboard">
        <span className="hulp-n">04</span>
        <h2>Zo lees je het dashboard</h2>
        <p className="hulp-lead">Bovenaan staan drie tegels. Elke lead staat altijd in precies één ervan:</p>
        <div className="hulp-lanes">
          {LANES.map((l) => (
            <div key={l.key} className={`hulp-lane ${l.key}`}>
              <span className="lane-ic"><Ic ic={l.icon} size={22} /></span>
              <b>{l.titel}</b>
              <span>
                {l.key === "jij" ? "Deze klanten wachten op jou. Hier moet je iets mee." :
                 l.key === "ai" ? "RepRight regelt het. Jij hoeft niets te doen." :
                 "Klaar: proefrit gepland, gesloten of de klant wil niets meer."}
              </span>
            </div>
          ))}
        </div>
        <p className="hulp-lead">Daaronder staat <b>Vandaag bellen</b>. Elke klant heeft daar een label:</p>
        <div className="labels">
          <div><span className="pill hot">👤 Moet: wacht op jou</span><span>Neem vandaag contact op. RepRight heeft het aan jou gegeven.</span></div>
          <div><span className="pill ok">📅 Proefrit morgen 10:00</span><span>Een proefrit van vandaag of morgen. Zet de auto klaar. Bellen hoeft niet, de klant krijgt automatisch een herinnering.</span></div>
          <div><span className="pill heat">🔥 Optioneel: heet</span><span>RepRight heeft al geantwoord. Bellen hoeft niet, maar vergroot de kans op verkoop.</span></div>
        </div>
      </section>

      {/* 5 ─ Een lead openen */}
      <section className="card hulp" id="lead">
        <span className="hulp-n">05</span>
        <h2>Een lead openen</h2>
        <p className="hulp-lead">Klik op een naam en je ziet alles over die klant. Van boven naar beneden:</p>
        <div className="todo">
          <div><span className="todo-n">1</span><div><b>Wie is aan zet?</b><span>De balk bovenaan zegt of jij iets moet doen of dat RepRight bezig is, en wat de volgende stap is.</span></div></div>
          <div><span className="todo-n">2</span><div><b>De vraag van de klant</b><span>Direct daaronder, in één zin. Zo weet je meteen waar het over gaat.</span></div></div>
          <div><span className="todo-n">3</span><div><b>Het gesprek</b><span>Zoals in WhatsApp. <span className="kleur klant">Klant</span> staat links, <span className="kleur ai">RepRight</span> en <span className="kleur jij">jij</span> staan rechts.</span></div></div>
        </div>
        <p className="hulp-lead">Rechtsboven vind je de knoppen:</p>
        <div className="knoppen">
          <div><b>📞 Bel</b><span>Belt de klant direct vanaf je telefoon.</span></div>
          <div><b>📅 Afspraak gemaakt</b><span>Heb je telefonisch een proefrit afgesproken? Vul dag en tijd in. RepRight stopt met opvolgen, zet hem in je agenda en stuurt de klant (als je wilt) een bevestiging en de dag ervoor een herinnering.</span></div>
          <div><b>✍️ Zelf reageren</b><span>Schrijf zelf een bericht. Zet je het vinkje &quot;Laat RepRight daarna weer opvolgen&quot; aan, dan neemt RepRight het daarna weer over.</span></div>
          <div><b><Ic ic="🤖" size={15} /> Geef terug aan RepRight</b><span>Jij bent klaar, RepRight gaat verder met opvolgen.</span></div>
          <div><b>Sluit lead</b><span>Stopt alles, bijvoorbeeld als de auto verkocht is. Je kunt hem later weer openen.</span></div>
        </div>
      </section>

      {/* 6 ─ Overdracht */}
      <section className="card hulp" id="overdracht">
        <span className="hulp-n">06</span>
        <h2>Wanneer geeft RepRight het aan jou?</h2>
        <p className="hulp-lead">In deze gevallen stopt RepRight meteen. Jij krijgt een e-mail en de lead staat bij &quot;Jij bent aan zet&quot;. Reageert de klant intussen nog een keer, dan antwoordt RepRight niet: het gesprek is van jou. Heb je na 3 uur nog niet gereageerd, dan krijg je nog een seintje.</p>
        <div className="overdracht">
          {OVERDRACHT.map((o) => (
            <div key={o.t}><span>{o.ic}</span><b>{o.t}</b><small>{o.s}</small></div>
          ))}
        </div>
      </section>

      {/* 7 ─ Vragen */}
      <section className="card hulp" id="vragen">
        <span className="hulp-n">07</span>
        <h2>Veelgestelde vragen</h2>
        <div className="x-faq app-faq">
          {FAQ.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
          <details>
            <summary>Wat betekenen alle statussen precies?</summary>
            <div className="st-all">
              {LANES.map((l) => (
                <div key={l.key} className="st-group">
                  <span className={`st-lane ${l.key}`}><Ic ic={l.icon} size={15} /> {l.titel}</span>
                  {l.statuses.map((st) => {
                    const i = statusInfo(st);
                    return (
                      <div key={st} className="st-row">
                        <div className="st-pill"><StatusPill status={st} /></div>
                        <div className="st-text">
                          <span>{i.uitleg}</span>
                          <span className="st-do"><b>Jij:</b> {i.jijDoet}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </details>
        </div>
      </section>

      <div className="hulp-foot">
        Staat je vraag er niet bij? Mail <a href="mailto:hallo@repright.ai">hallo@repright.ai</a> of <Link href="/dashboard">ga terug naar je dashboard →</Link>
      </div>
    </>
  );
}
