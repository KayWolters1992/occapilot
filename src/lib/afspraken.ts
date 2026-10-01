import { db } from "./db";
import { nuLokaal, tijdMs } from "./schedule";

/** Komende geboekte proefritten met klantnaam (voor waarschuwingen bij dubbele boekingen). */
export function bezetteTijdenMetNaam(dealerId: number, excludeLeadId = 0): { tijd: string; naam: string }[] {
  const rows = db()
    .prepare("SELECT afspraak_tijd tijd, customer_name naam FROM leads WHERE dealer_id=? AND id!=? AND status='afspraak' AND afspraak_tijd != ''")
    .all(dealerId, excludeLeadId) as { tijd: string; naam: string }[];
  const nu = tijdMs(nuLokaal());
  return rows.filter((r) => tijdMs(r.tijd) >= nu - 3600_000).map((r) => ({ tijd: r.tijd, naam: r.naam || "een klant" }));
}
