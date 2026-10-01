/**
 * Ingebouwde planner: draait mee in de server, elke 5 minuten.
 * Verstuurt herinneringen, proefrit-herinneringen en seintjes aan verkopers.
 * Geen externe cron nodig. /api/cron blijft bestaan als handmatige trigger.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.DISABLE_SCHEDULER === "1") return;
  const g = globalThis as unknown as { __repright_planner?: boolean };
  if (g.__repright_planner) return;
  g.__repright_planner = true;

  const { tick } = await import("./src/lib/pipeline");
  const ronde = async () => {
    try {
      const r = await tick();
      if (r.opvolging || r.afspraken || r.verkopers) console.log("[planner]", JSON.stringify(r));
    } catch (e) {
      console.error("[planner] fout", e);
    }
  };
  console.log("[planner] gestart: elke 5 minuten herinneringen en seintjes");
  setTimeout(ronde, 30_000);
  setInterval(ronde, 5 * 60_000);
}
