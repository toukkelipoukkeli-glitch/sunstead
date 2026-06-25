// pricing.ts — the cost engine.
//
// Turns the live Aiven `service_types` payload into a flat, comparable list of
// PriceRow[]: one row per (serviceType, plan, cloud). Each row carries the REAL
// hourly price from the API and a derived monthly estimate (price_usd * 730),
// an EU-residency flag, and the node sizing. The agent always compares these
// before recommending, and the UI renders them as the cost-comparison table.
//
// ─── VERIFIED LIVE (read-only curl against project touko-1f1c, June 2026) ───
// pg "startup-4":
//   upcloud-se-sto       $0.103   /hr  ->  $75.19/mo
//   upcloud-fi-hel1      $0.151   /hr  -> $110.23/mo
//   google-europe-west12 $0.13562 /hr  ->  $99.00/mo
// pg "free-1-1gb": $0.000/hr in EU clouds incl. aws-eu-west-1, upcloud-de-fra,
//   upcloud-nl-ams, do-fra, do-lon, do-ams, aws-eu-north-1, aws-eu-west-2/3.
// kafka "free-0": $0.000/hr, node_count 2; EU clouds do-fra / do-ams / do-lon.
// /clouds returns 153 clouds; 61 have geo_region "europe".
// These numbers reproduce exactly from normalizeServiceTypes() below.
// ───────────────────────────────────────────────────────────────────────────

import type { PriceRow } from "./types.ts";
import { EU_REGEX } from "./types.ts";

/** Avg hours per month used to project hourly -> monthly. */
export const HOURS_PER_MONTH = 730;

/** Shape of a single plan->region price entry inside service_types. */
type RegionInfo = {
  price_usd?: string | number;
  node_cpu_count?: number;
  node_memory_mb?: number;
  disk_space_mb?: number;
  disk_space_gb_price_usd?: string | number;
};

/** Is this cloud in an EU/EEA region (for data residency)? */
export function isEuCloud(cloud: string, geoRegion?: string): boolean {
  if (geoRegion && /europe/i.test(geoRegion)) return true;
  return EU_REGEX.test(cloud);
}

function num(v: unknown): number {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? "0"));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Flatten the raw `service_types` payload into PriceRow[].
 *
 * @param serviceTypes  the `.service_types` object from GET …/service_types
 * @param filter        optional narrowing: a single serviceType and/or plan
 * @param euLookup      optional map cloud_name -> eu flag (from /clouds) so we
 *                      can honor geo_region; falls back to name-regex.
 */
export function normalizeServiceTypes(
  serviceTypes: Record<string, any>,
  filter?: { serviceType?: string; plan?: string },
  euLookup?: Map<string, boolean>,
): PriceRow[] {
  const rows: PriceRow[] = [];
  const wantType = filter?.serviceType;
  const wantPlan = filter?.plan;

  for (const [serviceType, def] of Object.entries(serviceTypes)) {
    if (wantType && serviceType !== wantType) continue;
    const plans: any[] = def?.service_plans ?? [];
    for (const plan of plans) {
      const planName: string = plan?.service_plan;
      if (!planName) continue;
      if (wantPlan && planName !== wantPlan) continue;
      const regions: Record<string, RegionInfo> = plan?.regions ?? {};
      for (const [cloud, info] of Object.entries(regions)) {
        const pricePerHour = num(info.price_usd);
        const eu = euLookup?.has(cloud) ? !!euLookup.get(cloud) : isEuCloud(cloud);
        rows.push({
          serviceType,
          plan: planName,
          cloud,
          region: cloud, // Aiven's cloud_name is the region identifier
          eu,
          cpu: num(info.node_cpu_count),
          memMb: num(info.node_memory_mb),
          diskMb: num(info.disk_space_mb),
          pricePerHour,
          monthly: round2(pricePerHour * HOURS_PER_MONTH),
        });
      }
    }
  }
  return rows;
}

/**
 * Compare pricing for a workload: normalize, optionally restrict to a plan /
 * EU-only / a cloud allowlist, and sort cheapest-first (free plans float to
 * the top, then by monthly). This is what the agent and /api/pricing return.
 */
export function comparePricingRows(
  serviceTypes: Record<string, any>,
  o: { serviceType: string; plan?: string; clouds?: string[]; euOnly?: boolean },
  euLookup?: Map<string, boolean>,
): PriceRow[] {
  let rows = normalizeServiceTypes(
    serviceTypes,
    { serviceType: o.serviceType, plan: o.plan },
    euLookup,
  );
  if (o.euOnly) rows = rows.filter((r) => r.eu);
  if (o.clouds && o.clouds.length) {
    const allow = new Set(o.clouds);
    rows = rows.filter((r) => allow.has(r.cloud));
  }
  rows.sort((a, b) => {
    if (a.plan !== b.plan) {
      // group by plan, but keep plans containing "free" first
      const af = /free/i.test(a.plan) ? 0 : 1;
      const bf = /free/i.test(b.plan) ? 0 : 1;
      if (af !== bf) return af - bf;
      return a.plan.localeCompare(b.plan);
    }
    return a.monthly - b.monthly;
  });
  return rows;
}

/** Cheapest row that satisfies residency (euOnly). Undefined if none match. */
export function cheapestSatisfying(
  rows: PriceRow[],
  o?: { euOnly?: boolean },
): PriceRow | undefined {
  let pool = rows;
  if (o?.euOnly) pool = pool.filter((r) => r.eu);
  if (!pool.length) return undefined;
  return pool.reduce((best, r) => (r.monthly < best.monthly ? r : best));
}

/** Savings of `row` vs a reference (default = most expensive in the set). */
export function savingsVsDefault(rows: PriceRow[], row: PriceRow): number {
  if (!rows.length) return 0;
  const max = rows.reduce((m, r) => (r.monthly > m.monthly ? r : m), rows[0]);
  return round2(max.monthly - row.monthly);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
