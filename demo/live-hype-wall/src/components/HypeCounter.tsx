import { useEffect, useState } from "react";

export function HypeCounter({ total }: { total: number }) {
  const [display, setDisplay] = useState(total);
  const [bump, setBump] = useState(false);

  useEffect(() => {
    if (total === display) return;
    setBump(true);
    // animate count
    const start = display;
    const end = total;
    const duration = 600;
    const startTime = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else setTimeout(() => setBump(false), 400);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [total, display]);

  return (
    <div className="flex flex-col items-center text-center">
      <span className="text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">
        Live hype counter
      </span>
      <div className={`mt-2 font-display text-[clamp(4rem,12vw,11rem)] font-bold leading-none tracking-tight tabular-nums text-gradient-hype ${bump ? "animate-hype-pop" : ""}`}>
        {display.toLocaleString()}
      </div>
      <span className="mt-1 text-base font-medium text-muted-foreground md:text-lg">
        hypes and counting
      </span>
    </div>
  );
}
