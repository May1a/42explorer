import { useEffect, useState } from "react";
import { perSecondLimiter, perHourLimiter } from "../../lib/rate-limiter";

export function RateLimitBanner() {
  const [secWait, setSecWait] = useState(0);
  const [hourWait, setHourWait] = useState(0);

  useEffect(() => {
    const i = setInterval(() => {
      setSecWait(perSecondLimiter.nextAvailableIn());
      setHourWait(perHourLimiter.nextAvailableIn());
    }, 250);
    return () => clearInterval(i);
  }, []);

  if (secWait === 0 && hourWait === 0) return null;

  const delay = Math.max(secWait, hourWait);

  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs text-center"
      style={{
        background: "color-mix(in srgb, var(--color-yellow) 10%, transparent)",
        borderColor: "var(--color-yellow)",
        color: "var(--color-yellow)",
      }}
    >
      Rate limit cooldown: {Math.ceil(delay / 1000)}s
    </div>
  );
}
