/** Eén plek voor alle leadstatussen: label, kleur, wie aan zet is en wat het betekent. */

export type Lane = "jij" | "ai" | "klaar";

export interface StatusInfo {
  label: string;
  pill: "hot" | "ai" | "ok" | "wait" | "you";
  icon: string;
  lane: Lane;
  uitleg: string;
  jijDoet: string;
}

const MAP: Record<string, StatusInfo> = {
  escalatie: {
    label: "Actie nodig", pill: "hot", icon: "👤", lane: "jij",
    uitleg: "Occapilot heeft het gesprek aan jou overgedragen: een bod, inruilvraag, klacht of iets wat hij niet zeker weet.",
    jijDoet: "Bel de klant of reageer in het gesprek. Daarna geef je het terug of sluit je de lead.",
  },
  overgenomen: {
    label: "Jij voert gesprek", pill: "you", icon: "👤", lane: "jij",
    uitleg: "Jij hebt het gesprek overgenomen. Occapilot blijft stil en geeft je een seintje als de klant reageert.",
    jijDoet: "Rond het gesprek af. Wil je dat Occapilot weer opvolgt? Geef het terug.",
  },
  nieuw: {
    label: "Wordt verwerkt", pill: "ai", icon: "🤖", lane: "ai",
    uitleg: "De lead is net binnen. Occapilot leest hem uit en schrijft een antwoord.",
    jijDoet: "Niets. Binnen 2 minuten is hij beantwoord.",
  },
  actief: {
    label: "Occapilot volgt op", pill: "ai", icon: "🤖", lane: "ai",
    uitleg: "De klant heeft antwoord gekregen. Blijft het stil, dan stuurt Occapilot na 1, 3 en 7 dagen een herinnering.",
    jijDoet: "Niets. Is de lead heet, dan kun je alvast bellen.",
  },
  wacht: {
    label: "Wacht op klant", pill: "ai", icon: "🤖", lane: "ai",
    uitleg: "Het gesprek loopt en de bal ligt bij de klant. Reageert hij, dan antwoordt Occapilot meteen.",
    jijDoet: "Niets. Occapilot pakt het op zodra de klant iets stuurt.",
  },
  afspraak: {
    label: "Proefrit gepland", pill: "ok", icon: "✓", lane: "klaar",
    uitleg: "De klant heeft een moment gekozen. Jij hebt hiervan een melding gekregen.",
    jijDoet: "Bel of app de klant even ter bevestiging en zet de auto klaar.",
  },
  gesloten: {
    label: "Gesloten", pill: "wait", icon: "✓", lane: "klaar",
    uitleg: "Jij hebt de lead gesloten, bijvoorbeeld omdat de auto verkocht is. Alles blijft bewaard.",
    jijDoet: "Niets meer.",
  },
  gestopt: {
    label: "Afgemeld", pill: "wait", icon: "✓", lane: "klaar",
    uitleg: "De klant wil geen berichten meer. Occapilot stuurt hem nooit meer iets.",
    jijDoet: "Niets meer.",
  },
};

export function statusInfo(status: string): StatusInfo {
  return MAP[status] ?? MAP.actief;
}

export const LANES: { key: Lane; icon: string; titel: string; sub: string; statuses: string[] }[] = [
  { key: "jij", icon: "👤", titel: "Jij bent aan zet", sub: "Escalaties en gesprekken die jij voert", statuses: ["escalatie", "overgenomen"] },
  { key: "ai", icon: "🤖", titel: "Occapilot is bezig", sub: "Beantwoord en in opvolging. Jij hoeft niets te doen", statuses: ["nieuw", "actief", "wacht"] },
  { key: "klaar", icon: "✓", titel: "Afgerond", sub: "Proefrit gepland, gesloten of afgemeld", statuses: ["afspraak", "gesloten", "gestopt"] },
];

export const STATUS_VOLGORDE = ["escalatie", "overgenomen", "nieuw", "actief", "wacht", "afspraak", "gesloten", "gestopt"];
