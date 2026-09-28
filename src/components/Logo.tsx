/** RepRight AI merkidentiteit: afgeronde "R." (lijn-R met paarse punt) + woordmerk "RepRight" met paarse "AI". */

const INK = "#0b1026";
const LIGHT = "#f1f4ff";
const DOT = "#7b6cff";

export function LogoMark({ size = 30, onDark = false }: { size?: number; onDark?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" style={{ flex: "none" }}>
      <defs>
        <linearGradient id={onDark ? "rrDotD" : "rrDotL"} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b7bff" />
          <stop offset="1" stopColor="#6a5cf5" />
        </linearGradient>
      </defs>
      <path
        d="M13 39V9.5h11.5a8.75 8.75 0 0 1 0 17.5H13M24.5 27l8.5 12"
        fill="none"
        stroke={onDark ? LIGHT : INK}
        strokeWidth="5.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="40" cy="36.4" r="3.6" fill={`url(#${onDark ? "rrDotD" : "rrDotL"})`} />
    </svg>
  );
}

/** Woordmerk. `height` is de visuele hoogte van de hoofdletters (ongeveer). */
export function LogoWordmark({ height = 17, onDark = false }: { height?: number; onDark?: boolean }) {
  return (
    <span
      aria-label="RepRight AI"
      style={{
        fontFamily: "'Plus Jakarta Sans', Inter, sans-serif",
        fontWeight: 700,
        fontSize: Math.round(height * 1.32),
        letterSpacing: "-0.02em",
        lineHeight: 1,
        whiteSpace: "nowrap",
        color: onDark ? LIGHT : INK,
      }}
    >
      RepRight<span style={{ color: onDark ? "#a99bff" : "#6d4ef0", marginLeft: "0.22em" }}>AI</span>
    </span>
  );
}

export function Logo({ onDark = false, markSize = 30, wordHeight = 17 }: { onDark?: boolean; markSize?: number; wordHeight?: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: Math.round(markSize * 0.22) }}>
      <LogoMark size={markSize} onDark={onDark} />
      <LogoWordmark height={wordHeight} onDark={onDark} />
    </span>
  );
}

export const BRAND_DOT = DOT;
