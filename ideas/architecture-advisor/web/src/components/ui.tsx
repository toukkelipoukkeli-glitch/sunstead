import type { ReactNode } from "react";

// ── tiny shared atoms ──────────────────────────────────────────────────────

export function Card({
  children,
  className = "",
  glow = false,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-2xl border border-line bg-panel/80 backdrop-blur",
        glow ? "shadow-[0_0_0_1px_rgba(255,74,46,0.35),0_8px_40px_-12px_rgba(255,74,46,0.45)] border-accent/40" : "shadow-[0_8px_40px_-20px_rgba(0,0,0,0.8)]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  step,
  title,
  hint,
  right,
}: {
  step: number;
  title: string;
  hint?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3">
      <div className="flex items-center gap-2.5">
        <span className="grid place-items-center w-6 h-6 rounded-md bg-accent/15 text-accent text-xs font-mono font-bold border border-accent/30">
          {step}
        </span>
        <h2 className="text-sm font-semibold tracking-wide text-ink">{title}</h2>
        {hint && <span className="text-xs text-ink-faint hidden sm:inline">— {hint}</span>}
      </div>
      {right}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: "neutral" | "eu" | "accent" | "good" | "warn";
  className?: string;
}) {
  const tones: Record<string, string> = {
    neutral: "bg-panel-soft text-ink-muted border-line",
    eu: "bg-eu/12 text-eu border-eu/40",
    accent: "bg-accent/12 text-accent border-accent/40",
    good: "bg-good/12 text-good border-good/40",
    warn: "bg-warn/12 text-warn border-warn/40",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  className = "",
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger" | "subtle";
  disabled?: boolean;
  className?: string;
  title?: string;
}) {
  const variants: Record<string, string> = {
    primary:
      "bg-accent text-white hover:bg-accent-soft active:bg-accent-dim shadow-[0_6px_20px_-8px_rgba(255,74,46,0.7)]",
    ghost: "bg-transparent text-ink-muted hover:text-ink border border-line hover:border-ink-faint",
    subtle: "bg-panel-soft text-ink hover:bg-line border border-line",
    danger: "bg-transparent text-accent border border-accent/40 hover:bg-accent/10",
  };
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function MonoTag({ children }: { children: ReactNode }) {
  return (
    <code className="px-1.5 py-0.5 rounded-md bg-bg-soft border border-line-soft text-[12px] font-mono text-ink-muted">
      {children}
    </code>
  );
}
