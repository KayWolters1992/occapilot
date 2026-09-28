import { Ic } from "@/components/Ic";
import Link from "next/link";
import { currentDealer } from "@/lib/auth";
import { LANES, statusInfo } from "@/lib/status";
import { StatusPill } from "@/components/StatusPill";
import { InboundAddress } from "../leads/OnboardingCard";

export const dynamic = "force-dynamic";

const OVERDRACHT = [
  { ic: "💶", t: "Een bod of prijsvraag", s: "\"Kan er nog wat af?\" Onderhandelen doe jij." },
  { ic: "🔁", t: "Inruil", s: "RepRight noemt nooit een inruilwaarde." },
  { ic: "🏦", t: "Financiering of lease", s: "Bedragen en voorwaarden zijn jouw terrein." },
  { ic: "😠", t: "Een ontevreden klant", s: "Hij reageert neutraal en geeft het direct door." },
  { ic: "⚖️", t: "Juridische vragen", s: "Garantie, klachten, geschillen: altijd naar jou." },
  { ic: "❓", t: "Iets wat hij niet zeker weet", s: "Liever jij dan een verzonnen antwoord." },
];

const FAQ: { q: string; a: string }[] = [
  { q: "Kan de AI korting geven of iets toezeggen?", a: "Nee, nooit. RepRight verlaagt geen prijzen, belooft geen garanties en doet geen beloftes die jij niet hebt gedaan. Of hij mag zeggen dat een auto nog te koop staat, bepaal je zelf bij Instellingen. Bij een bod of prijsvraag geeft hij het gesprek direct aan jou." },
  { q: "Waar haalt de AI zijn informatie vandaan?", a: "Alleen uit de advertentie in de lead en uit de officiële RDW-gegevens (trekgewicht, APK, kleur). Weet hij iets niet, dan zegt hij dat jij er persoonlijk op terugkomt." },
  { q: "Hoe weet ik dat er iets op mij wacht?", a: "Je krijgt een e-mail zodra een lead aan jou wordt overgedragen of een proefrit is gepland. In het overzicht staat alles bovenaan bij 'Vandaag bellen' en in de bak 'Jij bent aan zet'." },
  { q: "Weet RepRight of een auto nog te koop is?", a: "Dat stel je zelf in bij Instellingen. Staan je advertenties alleen online zolang de auto te koop is, dan zegt RepRight gewoon: ja, hij staat nog te koop, en plant hij direct een proefrit. Zet je dat uit, dan laat RepRight de klant weten dat jij het checkt en geeft hij de lead aan jou. Jij krijgt een melding en bevestigt zelf per bericht of telefoon." },
  { q: "Kan ik zelf ingrijpen in een gesprek?", a: "Altijd. Open de lead en klik op 'Zelf reageren'. Je bepaalt zelf of RepRight daarna weer mag opvolgen. Met 'Sluit lead' stop je alles." },
  { q: "Hoe weet RepRight wanneer een proefrit kan?", a: "Uit je proefritrooster bij Instellingen. Daar zet je per dag open of dicht met tijden, hoe lang een proefrit duurt, hoe snel na een aanvraag het mag en je vrije dagen. RepRight stelt alleen momenten voor die daarin passen, meestal één ochtend en één middag." },
  { q: "Op welke tijden verstuurt RepRight berichten?", a: "Het eerste antwoord gaat direct, dag en nacht. Herinneringen gaan alleen tussen 08:00 en 20:30, zodat niemand 's nachts een opvolgmail krijgt." },
  { q: "Kunnen klanten zich afmelden?", a: "Ja. Antwoordt een klant 'stop', dan bevestigt RepRight dat netjes en stuurt hij deze klant nooit meer iets." },
  { q: "Wat als er meerdere leads op dezelfde auto binnenkomen?", a: "RepRight herkent dat aan het kenteken. Je ziet '👀 andere lead(s) op deze auto' in het overzicht, zodat je die auto met voorrang behandelt." },
];

export default async function Handleiding() {
  const dealer = (await currentDealer())!;
  const domain = process.env.INBOUND_DOMAIN || "…";
  const inbound = `leads-${dealer.inbound_token}@${domain}`;
  const toc = [
    ["kort", "In het kort"], ["dag", "Je dag"], ["instellen", "Aan de slag"], ["statussen", "Statussen"],
    ["overnemen", "Zelf reageren"], ["overdracht", "Wanneer jij het overneemt"], ["vragen", "Vragen"],
  ];

  return (
    <>
      <div className="pagehead">
        <div className="titles">
          <h1>Hulp & <em>uitleg</em></h1>
          <span className="subtitle">RepRight in 3 minuten. Zoek je iets specifieks? Spring direct naar het onderwerp.</span>
        </div>
      </div>

      <nav className="toc">
        {toc.map(([id, t]) => <a key={id} href={`#${id}`}>{t}</a>)}
      </nav>

      <section className="card hulp" id="kort">
        <span className="hulp-n">01</span>
        <h2>In het kort</h2>
        <p className="hulp-lead">
          RepRight is je tweede verkoper. Elke online lead krijgt <b>binnen 2 minuten</b> een persoonlijk antwoord in jouw naam,
          dag en nacht. Daarna volgt hij op tot er een proefrit staat. Iets wat een verkoper moet doen? Dan geeft hij het aan jou.
        </p>
        <div className="flowline">
          <span>📨 Lead komt binnen</span><i>→</i>
          <span>⚡ Antwoord binnen 2 min</span><i>→</i>
          <span>🔁 Opvolging dag 1, 3, 7</span><i>→</i>
          <span className="ok">✓ Proefrit gepland</span>
        </div>
        <p className="hulp-lead" style={{ marginTop: 6 }}>Elke lead staat altijd in precies één van deze drie bakken:</p>
        <div className="hulp-lanes">
          {LANES.map((l) => (
            <div key={l.key} className={`hulp-lane ${l.key}`}>
              <span className="lane-ic"><Ic ic={l.icon} size={22} /></span>
              <b>{l.titel}</b>
              <span>{l.sub}.</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card hulp" id="dag">
        <span className="hulp-n">02</span>
        <h2>Zo ziet je dag eruit</h2>
        <div className="dag">
          <div><span className="dag-ic">☕</span><b>&apos;s Ochtends</b><span>Open RepRight en bel de lijst bij <em>Vandaag bellen</em> af. Bovenaan wat op jou wacht, daarna de hete leads.</span></div>
          <div><span className="dag-ic">🔔</span><b>Tussendoor</b><span>Krijg je een mail &quot;Actie nodig&quot; of &quot;Proefrit gepland&quot;? Klik op de link en handel het af. Meer hoeft niet.</span></div>
          <div><span className="dag-ic">🌙</span><b>&apos;s Avonds en in het weekend</b><span>Niets. RepRight beantwoordt en volgt op terwijl jij vrij bent.</span></div>
        </div>
      </section>

      <section className="card hulp" id="instellen">
        <span className="hulp-n">03</span>
        <h2>Aan de slag: leads doorsturen</h2>
        <p className="hulp-lead">RepRight werkt via e-mail. Je stuurt de lead-mails van je kanalen automatisch door naar jouw eigen RepRight-adres:</p>
        <InboundAddress address={inbound} />
        <div className="howto">
          <div>
            <b>In Outlook</b>
            <ol>
              <li>Ga naar Instellingen → E-mail → Regels → Nieuwe regel.</li>
              <li>Voorwaarde: afzender bevat <code>autoscout24</code> (herhaal voor AutoTrack en Marktplaats).</li>
              <li>Actie: Doorsturen naar je RepRight-adres hierboven. Opslaan.</li>
            </ol>
          </div>
          <div>
            <b>In Gmail</b>
            <ol>
              <li>Instellingen → Alle instellingen → Doorsturen en POP/IMAP: voeg je RepRight-adres toe.</li>
              <li>Maak daarna een filter: Van <code>autoscout24</code> → Doorsturen naar dat adres.</li>
              <li>Herhaal het filter voor AutoTrack en Marktplaats.</li>
            </ol>
          </div>
        </div>
        <p className="note" style={{ margin: 0 }}>
          Tip: stuur daarna een voorbeeldlead vanuit het overzicht om te zien of alles werkt. Kom je er niet uit? Mail{" "}
          <a href="mailto:hallo@repright.ai">hallo@repright.ai</a>, dan stellen we het samen in. Kost vijf minuten.
        </p>
      </section>

      <section className="card hulp" id="statussen">
        <span className="hulp-n">04</span>
        <h2>Wat betekenen de statussen?</h2>
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
      </section>

      <section className="card hulp" id="overnemen">
        <span className="hulp-n">05</span>
        <h2>Zelf reageren of het gesprek overnemen</h2>
        <div className="dag">
          <div><span className="dag-ic">1</span><b>Open de lead</b><span>Bovenaan zie je direct wie aan zet is en wat er van jou verwacht wordt.</span></div>
          <div><span className="dag-ic">2</span><b>Klik op &quot;Zelf reageren&quot;</b><span>Typ je bericht of kies een snelle zin. Het gaat vanaf jouw adres, in hetzelfde gesprek.</span></div>
          <div><span className="dag-ic">3</span><b>Kies wie verder gaat</b><span>Vinkje aan: RepRight volgt daarna weer op. Vinkje uit: jij voert het gesprek en RepRight blijft stil.</span></div>
        </div>
        <p className="note" style={{ margin: 0 }}>
          Met <b>Geef terug aan RepRight</b> laat je hem weer opvolgen. Met <b>Sluit lead</b> stop je alles, bijvoorbeeld als de auto verkocht is.
        </p>
      </section>

      <section className="card hulp" id="overdracht">
        <span className="hulp-n">06</span>
        <h2>Wanneer geeft RepRight het aan jou?</h2>
        <p className="hulp-lead">RepRight stopt direct en stuurt jou een melding bij:</p>
        <div className="overdracht">
          {OVERDRACHT.map((o) => (
            <div key={o.t}><span>{o.ic}</span><b>{o.t}</b><small>{o.s}</small></div>
          ))}
        </div>
      </section>

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
        </div>
      </section>

      <div className="hulp-foot">
        Nog een vraag? Mail <a href="mailto:hallo@repright.ai">hallo@repright.ai</a> of <Link href="/leads">ga terug naar je overzicht →</Link>
      </div>
    </>
  );
}
