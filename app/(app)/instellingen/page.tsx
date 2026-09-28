import { currentDealer } from "@/lib/auth";
import { updateSettings } from "../../actions";
import { parseSchedule } from "@/lib/schedule";
import { ScheduleEditor } from "./ScheduleEditor";

export const dynamic = "force-dynamic";

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "?";
}

export default async function Settings({ searchParams }: { searchParams: Promise<{ opgeslagen?: string }> }) {
  const dealer = (await currentDealer())!;
  const sp = await searchParams;
  const domain = process.env.INBOUND_DOMAIN || "…";
  return (
    <>
      <div className="pagehead">
        <div className="titles">
          <h1>Instellingen</h1>
          <span className="subtitle">Je gegevens, je proefritrooster en hoe leads binnenkomen.</span>
        </div>
      </div>
      {sp.opgeslagen && <span className="pill ok" style={{ alignSelf: "flex-start" }}>✓ {sp.opgeslagen === "rooster" ? "Proefritrooster opgeslagen" : "Opgeslagen"}</span>}

      <div className="profileband">
        <span className="avatar">{initials(dealer.seller_name || dealer.name)}</span>
        <div>
          <b>{dealer.name}</b>
          <span>{dealer.seller_name} · {dealer.city || "geen plaats ingesteld"}</span>
        </div>
      </div>

      <div className="card warmcard" style={{ maxWidth: 680 }}>
        <div className="cardhead">
          <span className="cardic">🏢</span>
          <div>
            <span className="cardtitle">Bedrijf</span>
            <span className="carddesc">Deze gegevens gebruikt RepRight in elk gesprek namens jou.</span>
          </div>
        </div>
        <form action={updateSettings} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="field"><label htmlFor="name">Bedrijfsnaam</label>
            <input id="name" name="name" type="text" defaultValue={dealer.name} /></div>
          <div className="field"><label htmlFor="city">Plaats</label>
            <input id="city" name="city" type="text" defaultValue={dealer.city} /></div>
          <div className="field"><label htmlFor="seller_name">Naam verkoper</label>
            <input id="seller_name" name="seller_name" type="text" defaultValue={dealer.seller_name} /></div>
          <div className="field"><label htmlFor="from_email">Afzenderadres richting klant (geverifieerd in Postmark)</label>
            <input id="from_email" name="from_email" type="email" defaultValue={dealer.from_email} /></div>
          <label className="check-row">
            <input type="checkbox" name="stock_live" defaultChecked={dealer.stock_live !== 0} />
            <span>
              <b>Mijn advertenties staan alleen online zolang de auto te koop is</b>
              <small><b className="on">Aan:</b> vraagt een klant of de auto er nog is, dan zegt RepRight "ja, hij staat nog te koop" en plant direct een proefrit.<br /><b className="off">Uit:</b> RepRight laat de klant weten dat jij het checkt en geeft de lead aan jou. Je ziet hem bij "Jij bent aan zet" en krijgt een melding. Jij bevestigt per bericht of telefoon.</small>
            </span>
          </label>
          <button className="btn" style={{ alignSelf: "flex-start" }}>Opslaan</button>
        </form>
      </div>

      <div className="card warmcard" id="rooster" style={{ maxWidth: 1040, scrollMarginTop: 20 }}>
        <div className="cardhead">
          <span className="cardic">🗓️</span>
          <div>
            <span className="cardtitle">Proefrit- en bezichtigingsmomenten</span>
            <span className="carddesc">RepRight stelt klanten alleen momenten voor die in dit rooster passen. In het voorbeeld zie je live wat hij nu zou voorstellen.</span>
          </div>
        </div>
        <ScheduleEditor initial={parseSchedule(dealer.schedule_json)} />
      </div>

      <div className="card warmcard" style={{ maxWidth: 680 }}>
        <div className="cardhead">
          <span className="cardic">📥</span>
          <div>
            <span className="cardtitle">Leads binnen laten komen</span>
            <span className="carddesc">Eén doorstuurregel. Daarna doet RepRight de rest, voorgoed.</span>
          </div>
        </div>
        <p className="note" style={{ margin: 0 }}>
          Stuur de lead-notificaties van AutoScout24, AutoTrack en de eigen website automatisch door naar:
        </p>
        <code style={{ fontSize: 14, color: "var(--ink)", background: "var(--code-bg)", borderRadius: 10, padding: "10px 14px", width: "max-content", maxWidth: "100%" }}>
          leads-{dealer.inbound_token}@{domain}
        </code>
        <p className="note" style={{ margin: 0 }}>
          Dat is alles. Vanaf dan beantwoordt en volgt RepRight elke lead automatisch op.
        </p>
      </div>
    </>
  );
}
