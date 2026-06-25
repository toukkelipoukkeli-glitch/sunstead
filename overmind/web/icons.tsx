// icons.tsx — a small, dependency-free icon set for the Overmind console.
// Every glyph is an inline SVG drawn on a 24×24 grid with a 1.5px stroke and
// `currentColor`, so they inherit text color and size cleanly via CSS. The
// colorful Logo (Aiven-style rainbow hexagon) and the per-service tiles are the
// only multi-color marks — everything else is a crisp monochrome line icon.

import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

// Shared wrapper: sets the canonical stroke style every line icon uses.
function Svg({ size = 18, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  )
}

export function Database(props: IconProps) {
  return (
    <Svg {...props}>
      <ellipse cx="12" cy="5.5" rx="7" ry="3" />
      <path d="M5 5.5v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
      <path d="M5 11.5v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
    </Svg>
  )
}

export function Stream(props: IconProps) {
  // Kafka / event-mesh: three flowing lanes with a node on each.
  return (
    <Svg {...props}>
      <path d="M3 7h11" />
      <path d="M3 12h15" />
      <path d="M3 17h9" />
      <circle cx="17.5" cy="7" r="2" />
      <circle cx="20.5" cy="12" r="1.6" />
      <circle cx="15.5" cy="17" r="2" />
    </Svg>
  )
}

export function Bolt(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M13 2 4 13.5h6L11 22l9-11.5h-6L13 2Z" />
    </Svg>
  )
}

export function Check(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 12.5 10 17.5 19 6.5" />
    </Svg>
  )
}

export function ArrowRight(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 12h15" />
      <path d="M13 6l6 6-6 6" />
    </Svg>
  )
}

export function Shield(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3 5 5.5v5c0 4.3 2.9 7.6 7 9.5 4.1-1.9 7-5.2 7-9.5v-5L12 3Z" />
      <path d="M9 11.5l2.2 2.2L15 9.8" />
    </Svg>
  )
}

export function Sparkle(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3c.6 3.8 2.2 5.4 6 6-3.8.6-5.4 2.2-6 6-.6-3.8-2.2-5.4-6-6 3.8-.6 5.4-2.2 6-6Z" />
      <path d="M19 14c.3 1.6 1 2.2 2.5 2.5-1.5.3-2.2 1-2.5 2.5-.3-1.5-1-2.2-2.5-2.5 1.5-.3 2.2-1 2.5-2.5Z" />
    </Svg>
  )
}

export function Server(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="4" width="17" height="7" rx="2" />
      <rect x="3.5" y="13" width="17" height="7" rx="2" />
      <path d="M7 7.5h.01M7 16.5h.01" />
      <path d="M11 7.5h5M11 16.5h5" />
    </Svg>
  )
}

export function Activity(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 12h4l2.5-7 4 14 2.5-7H21" />
    </Svg>
  )
}

export function Search(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4 4" />
    </Svg>
  )
}

export function Plus(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  )
}

export function Dot(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="3.5" fill="currentColor" stroke="none" />
    </Svg>
  )
}

export function Gauge(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4.5 16.5a8 8 0 1 1 15 0" />
      <path d="M12 13.5 16 9" />
      <circle cx="12" cy="13.8" r="1.3" fill="currentColor" stroke="none" />
    </Svg>
  )
}

export function Lock(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
      <path d="M12 14.5v2" />
    </Svg>
  )
}

export function Cloud(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M7 18.5a4 4 0 0 1-.5-7.97 5.5 5.5 0 0 1 10.6-1.2A4 4 0 0 1 17 18.5H7Z" />
    </Svg>
  )
}

export function Rocket(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3c2.8 1.2 5 4.2 5 8 0 1.8-.6 3.4-1.4 4.6L14 17h-4l-1.6-1.4A8 8 0 0 1 7 11c0-3.8 2.2-6.8 5-8Z" />
      <circle cx="12" cy="10" r="1.6" />
      <path d="M10 17c-.7 1.5-2 2.4-3.5 2.6.2-1.5 1.1-2.8 2.6-3.5M14 17c.7 1.5 2 2.4 3.5 2.6-.2-1.5-1.1-2.8-2.6-3.5" />
    </Svg>
  )
}

// ── extra utility glyphs the dashboard leans on ──
export function Layers(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3 3 8l9 5 9-5-9-5Z" />
      <path d="M3 13l9 5 9-5" />
    </Svg>
  )
}

export function Coins(props: IconProps) {
  return (
    <Svg {...props}>
      <ellipse cx="12" cy="6.5" rx="6.5" ry="3" />
      <path d="M5.5 6.5v5c0 1.66 2.9 3 6.5 3s6.5-1.34 6.5-3v-5" />
      <path d="M5.5 11.5v5c0 1.66 2.9 3 6.5 3s6.5-1.34 6.5-3v-5" />
    </Svg>
  )
}

export function Network(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="5" r="2.2" />
      <circle cx="5.5" cy="18" r="2.2" />
      <circle cx="18.5" cy="18" r="2.2" />
      <path d="M12 7.2 6.5 16M12 7.2 17.5 16M7.7 18h8.6" />
    </Svg>
  )
}

export function Clock(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5V12l3 2" />
    </Svg>
  )
}

export function FileCode(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9l-6-6Z" />
      <path d="M13 3v5a1 1 0 0 0 1 1h5" />
      <path d="M10.5 13 9 14.5l1.5 1.5M13.5 13 15 14.5 13.5 16" />
    </Svg>
  )
}

// ── Logo: Aiven-style colorful hexagon mark ──
// A six-sided silhouette filled with a multi-stop gradient (teal → green →
// violet → magenta → amber), echoing Aiven's rainbow brand mark. Tasteful, not
// neon. `id` makes the gradient unique so multiple logos can coexist on a page.
let logoSeq = 0
export function Logo({ size = 24, ...rest }: IconProps) {
  const gid = `om-logo-grad-${(logoSeq = (logoSeq + 1) % 100000)}`
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      {...rest}
    >
      <defs>
        <linearGradient id={gid} x1="2" y1="3" x2="22" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#16b894" />
          <stop offset="0.32" stopColor="#0e9f6e" />
          <stop offset="0.58" stopColor="#7c5cff" />
          <stop offset="0.8" stopColor="#d6489a" />
          <stop offset="1" stopColor="#f5a524" />
        </linearGradient>
      </defs>
      <path
        d="M12 1.6 21.5 7v10L12 22.4 2.5 17V7L12 1.6Z"
        fill={`url(#${gid})`}
      />
      <path
        d="M12 6.4 17.2 9.4v5.2L12 17.6 6.8 14.6V9.4L12 6.4Z"
        fill="#ffffff"
        fillOpacity="0.92"
      />
      <path
        d="M12 9.2 14.7 10.8v3.2L12 15.6 9.3 14V10.8L12 9.2Z"
        fill={`url(#${gid})`}
        fillOpacity="0.85"
      />
    </svg>
  )
}

// ── ServiceIcon: colorful soft-tile glyphs for Aiven services ──
// Each returns a rounded tile (soft tinted background) with a white-on-color
// mark — mirroring how Aiven's console renders per-service icons. `kind`
// selects the palette + glyph; default falls back to a generic database tile.
export function ServiceIcon({
  kind,
  size = 36,
}: {
  kind: 'postgres' | 'kafka' | 'pgvector' | 'app' | 'generic'
  size?: number
}) {
  const map = {
    postgres: { bg: '#e8f0fb', fg: '#2f6fc4', glyph: <Database size={size * 0.5} /> },
    kafka: { bg: '#f6e9f5', fg: '#b23a9d', glyph: <Stream size={size * 0.5} /> },
    pgvector: { bg: '#efeafc', fg: '#7c5cff', glyph: <Network size={size * 0.5} /> },
    app: { bg: '#e8f6ee', fg: '#18794e', glyph: <Cloud size={size * 0.5} /> },
    generic: { bg: '#eef0f2', fg: '#5b6470', glyph: <Server size={size * 0.5} /> },
  }[kind]
  return (
    <span
      className="svc-tile"
      style={{
        width: size,
        height: size,
        background: map.bg,
        color: map.fg,
        borderRadius: Math.round(size * 0.28),
        display: 'inline-grid',
        placeItems: 'center',
        flexShrink: 0,
      }}
    >
      {map.glyph}
    </span>
  )
}
