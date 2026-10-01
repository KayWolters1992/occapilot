/* eslint-disable @next/next/no-img-element */
/**
 * RepRight AI: het officiële logo (beeldmerk "R." + woordmerk "RepRightAI").
 * Bestanden in /public/brand: *-dark = donkere inkt (voor lichte achtergrond), *-light = voor donkere achtergrond.
 * Verhoudingen van het bronbestand: logo 1503×260, beeldmerk 226×260, woordmerk 1118×221.
 */

export function LogoMark({ size = 30, onDark = false }: { size?: number; onDark?: boolean }) {
  return (
    <img
      src={`/brand/mark-${onDark ? "light" : "dark"}.png`}
      alt=""
      aria-hidden="true"
      height={size}
      width={Math.round((size * 226) / 260)}
      style={{ display: "block", flex: "none", height: size, width: "auto", objectFit: "contain" }}
    />
  );
}

export function LogoWordmark({ height = 17, onDark = false }: { height?: number; onDark?: boolean }) {
  return (
    <img
      src={`/brand/word-${onDark ? "light" : "dark"}.png`}
      alt="RepRight AI"
      height={height}
      width={Math.round((height * 1118) / 221)}
      style={{ display: "block", height, width: "auto", alignSelf: "flex-start", objectFit: "contain" }}
    />
  );
}

/** Volledig logo zoals ontworpen. `markSize` = hoogte van het beeldmerk (= hoogte van het hele logo). */
export function Logo({ onDark = false, markSize = 30 }: { onDark?: boolean; markSize?: number; wordHeight?: number }) {
  return (
    <img
      src={`/brand/logo-${onDark ? "light" : "dark"}.png`}
      alt="RepRight AI"
      height={markSize}
      width={Math.round((markSize * 1503) / 260)}
      style={{ display: "block", height: markSize, width: "auto", maxWidth: "100%", alignSelf: "flex-start", objectFit: "contain" }}
    />
  );
}
