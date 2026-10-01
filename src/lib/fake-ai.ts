/**
 * Test-AI: voorspelbare antwoorden zonder API-sleutel (REPRIGHT_FAKE_AI=1).
 * Alleen voor lokaal testen en scenario-tests, nooit in productie aanzetten.
 */
import type { IntakeResult, ReplyResult } from "./ai";

export function fakeIntake(raw: string): IntakeResult {
  const naam = raw.match(/Van:\s*([^<\n]+)/)?.[1]?.trim() || "Testklant";
  const email = raw.match(/<([^>]+@[^>]+)>/)?.[1] || "";
  const bod = /bod|korting|onderhandel/i.test(raw);
  return {
    lead: { naam, auto: "BMW 3-Serie 320i Touring", kenteken: "K-123-XZ", prijs: "€ 24.950", email, telefoon: "06-12345678", bron: "AutoScout24", vraag: "Kan ik een proefrit maken?" },
    kwalificatie: { label: "Heet", reden: "Wil een proefrit." },
    direct: { onderwerp: "Je vraag over de BMW", tekst: "Hoi! Ja, hij staat nog te koop. Schikt zaterdag 10.00 of 15.00?" },
    followups: [
      { dag: "dag1", onderwerp: "Nog even over de BMW", tekst: "Kort berichtje..." },
      { dag: "dag3", onderwerp: "Proefrit?", tekst: "Nog interesse?" },
      { dag: "dag7", onderwerp: "Laatste bericht", tekst: "Liever geen berichten meer? Antwoord dan met 'stop'." },
    ],
    escalatie_nu: bod,
    escalatie_reden: bod ? "Klant doet een bod." : "",
  };
}

export function fakeReply(msg: string): ReplyResult {
  const leeg = { herinneringen: [] as ReplyResult["herinneringen"], afspraak: false, afspraak_moment: "" };
  if (/^\s*stop\b/i.test(msg)) return { ...leeg, actie: "stop", onderwerp: "Afgemeld", tekst: "Je bent afgemeld.", reden: "Afmelding verwerkt" };
  if (/bod|korting/i.test(msg)) return { ...leeg, actie: "escaleer", onderwerp: "Je bericht", tekst: "Kay neemt persoonlijk contact op.", reden: "Klant doet een bod." };
  const t = msg.match(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2})/)?.[1];
  if (t) return { ...leeg, actie: "antwoord", onderwerp: "Bevestiging", tekst: `Top, tot dan!`, reden: "Klant koos een moment.", afspraak: true, afspraak_moment: t };
  return {
    actie: "antwoord", onderwerp: "Re: je vraag", tekst: "Goede vraag, hier het antwoord.", reden: "", afspraak: false, afspraak_moment: "",
    herinneringen: [
      { dag: "dag2", onderwerp: "Nog vragen?", tekst: "Duwtje." },
      { dag: "dag5", onderwerp: "Laatste check", tekst: "Liever geen berichten meer? Antwoord dan met 'stop'." },
    ],
  };
}
