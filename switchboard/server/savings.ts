// ILLUSTRATIVE pricing. Replace with live Aiven + Supabase list prices before pitching.
// The honest story: Aiven wins clearly on multi-project consolidation and when you'd
// otherwise pay Supabase compute/storage add-ons. Single tiny project = modest saving.
export const PRICING = {
  supabaseProMonthly: 25, // per project
  aiven: [
    { plan: 'hobbyist', maxGiB: 1, monthly: 19, ram: '1 GB', cpu: '1 vCPU' },
    { plan: 'startup-4', maxGiB: 16, monthly: 60, ram: '4 GB', cpu: '1 vCPU' },
    { plan: 'business-8', maxGiB: 70, monthly: 120, ram: '8 GB', cpu: '2 vCPU' },
  ],
}

export type Savings = ReturnType<typeof estimateSavings>

export function estimateSavings(sizeBytes: number, projects = 1) {
  const sizeGiB = sizeBytes / 1024 ** 3
  const tier = PRICING.aiven.find((t) => sizeGiB <= t.maxGiB) ?? PRICING.aiven[PRICING.aiven.length - 1]
  const supabaseMonthly = PRICING.supabaseProMonthly * Math.max(1, projects)
  const aivenMonthly = tier.monthly
  const monthlySavings = Math.max(0, supabaseMonthly - aivenMonthly)
  const pct = supabaseMonthly > 0 ? Math.round((monthlySavings / supabaseMonthly) * 100) : 0
  return {
    sizeGiB: Math.round(sizeGiB * 100) / 100,
    plan: tier.plan,
    planSpec: `${tier.ram} · ${tier.cpu}`,
    projects: Math.max(1, projects),
    supabaseMonthly,
    aivenMonthly,
    monthlySavings,
    yearlySavings: monthlySavings * 12,
    pct,
    illustrative: true,
  }
}
