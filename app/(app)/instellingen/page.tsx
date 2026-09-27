import { currentDealer } from "@/lib/auth";
import { updateSettings } from "../../actions";

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
          <span className="subtitle">Bedrijfsgegevens, verzendmomenten en de lead-instroom.</span>
        </div>
      </div>
      {sp.opgeslagen && <span className="pill ok" style={{ alignSelf: "flex-start" }}>✓ Opgeslagen</span>}

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
            <span className="carddesc">Deze gegevens gebruikt Occapilot in elk gesprek namens jou.</span>
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
          <div className="field"><label htmlFor="opening_hours">Proefrit- / bezichtigingsmomenten</label>
            <input id="opening_hours" name="opening_hours" type="text" defaultValue={dealer.opening_hours} /></div>
          <button className="btn" style={{ alignSelf: "flex-start" }}>Opslaan</button>
        </form>
      </div>

      <div className="card warmcard" style={{ maxWidth: 680 }}>
        <div className="cardhead">
          <span className="cardic">📥</span>
          <div>
            <span className="cardtitle">Leads binnen laten komen</span>
            <span className="carddesc">Eén doorstuurregel. Daarna doet Occapilot de rest, voorgoed.</span>
          </div>
        </div>
        <p className="note" style={{ margin: 0 }}>
          Stuur de lead-notificaties van AutoScout24, AutoTrack en de eigen website automatisch door naar:
        </p>
        <code style={{ fontSize: 14, color: "var(--ink)", background: "#f1f3fa", borderRadius: 10, padding: "10px 14px", width: "max-content", maxWidth: "100%" }}>
          leads-{dealer.inbound_token}@{domain}
        </code>
        <p className="note" style={{ margin: 0 }}>
          Dat is alles. Vanaf dan beantwoordt en volgt Occapilot elke lead automatisch op.
        </p>
      </div>
    </>
  );
}
