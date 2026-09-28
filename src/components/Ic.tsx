import { LogoMark } from "./Logo";

/** Toont een status-icoon; het RepRight-icoon (🤖) wordt het R.-beeldmerk. */
export function Ic({ ic, size = 18 }: { ic: string; size?: number }) {
  if (ic === "🤖") return <LogoMark size={size} onDark />;
  return <>{ic}</>;
}
