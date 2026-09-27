import type { RdwInfo } from "./types";

/**
 * RDW open data — gratis, geen API-key nodig.
 * Voertuiggegevens: m9d7-ebf2 (gekentekende voertuigen).
 */
export async function rdwLookup(plateRaw: string): Promise<RdwInfo | null> {
  const plate = plateRaw.replace(/[^a-z0-9]/gi, "").toUpperCase();
  if (plate.length < 5 || plate.length > 8) return null;
  try {
    const res = await fetch(
      `https://opendata.rdw.nl/resource/m9d7-ebf2.json?kenteken=${encodeURIComponent(plate)}`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as Record<string, string>[];
    const v = rows[0];
    if (!v) return null;
    const fmtDate = (s?: string) =>
      s && s.length >= 8 ? `${s.slice(6, 8)}-${s.slice(4, 6)}-${s.slice(0, 4)}` : undefined;
    const kg = (s?: string) => (s && s !== "0" ? `${Number(s).toLocaleString("nl-NL")} kg` : undefined);
    return {
      merk: v.merk,
      handelsbenaming: v.handelsbenaming,
      apk_tot: fmtDate(v.vervaldatum_apk),
      trekgewicht_geremd: kg(v.maximum_trekken_massa_geremd),
      trekgewicht_ongeremd: kg(v.maximum_massa_trekken_ongeremd),
      kleur: v.eerste_kleur,
      km_stand_oordeel: v.tellerstandoordeel,
    };
  } catch {
    return null;
  }
}

export function rdwToText(r: RdwInfo | null): string {
  if (!r) return "OFFICIËLE RDW-VOERTUIGDATA: niet beschikbaar voor deze lead.";
  const lines: string[] = [];
  if (r.merk) lines.push(`- Merk/model (RDW): ${r.merk} ${r.handelsbenaming ?? ""}`.trim());
  if (r.apk_tot) lines.push(`- APK geldig tot: ${r.apk_tot}`);
  if (r.trekgewicht_geremd) lines.push(`- Maximaal trekgewicht geremd: ${r.trekgewicht_geremd}`);
  if (r.trekgewicht_ongeremd) lines.push(`- Maximaal trekgewicht ongeremd: ${r.trekgewicht_ongeremd}`);
  if (r.kleur) lines.push(`- Kleur: ${r.kleur}`);
  if (r.km_stand_oordeel) lines.push(`- Tellerstandoordeel: ${r.km_stand_oordeel}`);
  return lines.length
    ? "OFFICIËLE RDW-VOERTUIGDATA (geverifieerd, mag je noemen als “volgens de officiële RDW-gegevens”):\n" + lines.join("\n")
    : "OFFICIËLE RDW-VOERTUIGDATA: niet beschikbaar voor deze lead.";
}
