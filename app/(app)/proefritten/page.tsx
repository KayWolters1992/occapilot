import Link from "next/link";
import { db } from "@/lib/db";
import { currentDealer } from "@/lib/auth";
import type { Lead } from "@/lib/types";
import { Plate, wanneer } from "@/components/LeadBits";
import { closeLead } from "../../actions";

export const dynamic = "force-dynamic";

type Rij = Lead & { afspraak_tekst: string | null; afspraak_op: string | null };

export default async function Proefritten() {
  const dealer = (await currentDealer())!;
  const rows = db()
    .prepare(
      `SELECT l.*,
         (SELECT body FROM messages m WHERE m.lead_id=l.id AND m.meta='afspraak' ORDER BY m.id DESC LIMIT 1) AS afspraak_tekst,
         (SELECT created_at FROM messages m WHERE m.lead_id=l.id AND m.meta='afspraak' ORDER BY m.id DESC LIMIT 1) AS afspraak_op
       FROM leads l WHERE l.dealer_id=? AND l.status='afspraak'
       ORDER BY COALESCE(afspraak_op, l.updated_at) DESC`
    )
    .all(dealer.id) as Rij[];

  return (
    <>
      <div className="pagehead">
        <div className="titles">
          <h1>Proefritten <em>gepland</em></h1>
          <span className="subtitle">Klanten die een moment hebben gekozen. Bel of app ze even ter bevestiging en zet de auto klaar.</span>
        </div>
        <Link href="/instellingen#rooster" className="btn ghost small">🗓️ Proefritrooster aanpassen</Link>
      </div>

      {rows.length === 0 ? (
        <div className="card">
          <div className="empty big">
            <span className="empty-ic">📅</span>
            <b>Nog geen proefritten gepland</b>
            <span>Zodra een klant een moment kiest, zet RepRight hem hier neer en krijg jij een melding.</span>
            <Link href="/leads?bak=ai" className="start-link">Bekijk de leads waar RepRight mee bezig is →</Link>
          </div>
        </div>
      ) : (
        <div className="ritten">
          {rows.map((l) => (
            <div key={l.id} className="rit">
              <div className="rit-date">
                <span>✓</span>
                <small>{l.afspraak_op ? `gepland ${wanneer(l.afspraak_op)}` : "gepland"}</small>
              </div>
              <div className="rit-body">
                <div className="rit-top">
                  <b>{l.customer_name || "Onbekend"}</b>
                  <Plate p={l.license_plate} />
                </div>
                <span className="rit-car">{l.vehicle || "Onbekende auto"}{l.price ? ` · ${l.price}` : ""}</span>
                <p>{l.afspraak_tekst || "De klant heeft een moment gekozen. Bekijk het gesprek voor de details."}</p>
              </div>
              <form action={closeLead} className="rit-actions">
                <input type="hidden" name="id" value={l.id} />
                {l.customer_phone && <a className="btn small" href={`tel:${l.customer_phone.replace(/\s/g, "")}`}>📞 Bevestig: {l.customer_phone}</a>}
                <Link className="btn ghost small" href={`/leads/${l.id}`}>Open gesprek →</Link>
                <button className="btn ghost small subtle" name="status" value="gesloten">Afgerond, sluit lead</button>
              </form>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
