/** Occapilot merkidentiteit: toerenteller-beeldmerk + Race-woordmerk (OCCA + PILOT in gradient). */

export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id="opGrad" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#4f7cff" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="40" height="40" rx="11" fill="url(#opGrad)" />
      <path
        d="M 11.3 28.6 A 13.5 13.5 0 1 1 36.7 28.6"
        fill="none"
        stroke="#fff"
        strokeWidth="4.4"
        strokeLinecap="round"
      />
      <line x1="24" y1="26" x2="32.8" y2="17.2" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
      <circle cx="24" cy="26" r="3.4" fill="#fff" />
    </svg>
  );
}

/** Woordmerk. `onDark` bepaalt de kleur van "OCCA" (wit op donker, inkt op licht). */
export function LogoWordmark({ height = 17, onDark = false }: { height?: number; onDark?: boolean }) {
  const width = (height / 40) * 226;
  return (
    <svg width={width} height={height} viewBox="-2 2 226 40" aria-label="Occapilot">
      <defs>
        <linearGradient id="opGradH" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#4f7cff" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
        <mask id={onDark ? "opSlD" : "opSlL"}>
          <rect x="-10" y="-6" width="250" height="54" fill="#fff" />
          <path d="M 62 -6 l 3.6 0 l -11.5 54 l -3.6 0 Z" fill="#000" />
          <path d="M 153.5 -6 l 3.6 0 l -11.5 54 l -3.6 0 Z" fill="#000" />
        </mask>
      </defs>
      <g mask={`url(#${onDark ? "opSlD" : "opSlL"})`}>
        <text
          x="0"
          y="33"
          fontFamily="'Exo 2',sans-serif"
          fontStyle="italic"
          fontWeight="800"
          fontSize="30"
          letterSpacing="1"
          fill={onDark ? "#ffffff" : "#14193a"}
        >
          OCCA
        </text>
        <text
          x="89"
          y="33"
          fontFamily="'Exo 2',sans-serif"
          fontStyle="italic"
          fontWeight="800"
          fontSize="30"
          letterSpacing="1"
          fill="url(#opGradH)"
        >
          PILOT
        </text>
      </g>
    </svg>
  );
}

export function Logo({ onDark = false, markSize = 30, wordHeight = 17 }: { onDark?: boolean; markSize?: number; wordHeight?: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <LogoMark size={markSize} />
      <LogoWordmark height={wordHeight} onDark={onDark} />
    </span>
  );
}
