// Small display helpers shared across components.

export const usd = (n: number | undefined): string =>
  n == null
    ? "—"
    : n.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: n < 10 ? 4 : 0,
      });

export const usdMonthly = (n: number | undefined): string =>
  n == null
    ? "—"
    : `${n.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      })}/mo`;

export const gb = (mb: number): string =>
  mb >= 1024 ? `${Math.round(mb / 1024)} GB` : `${mb} MB`;

export const ms = (n: number | undefined): string =>
  n == null ? "—" : `${n.toFixed(1)} ms`;

// Friendly cloud/provider label, e.g. "upcloud-se-sto" -> "UpCloud · SE-STO".
export function cloudLabel(cloud: string): string {
  const [provider, ...rest] = cloud.split("-");
  const providers: Record<string, string> = {
    upcloud: "UpCloud",
    aws: "AWS",
    google: "GCP",
    do: "DO",
    azure: "Azure",
  };
  const p = providers[provider] ?? provider;
  return rest.length ? `${p} · ${rest.join("-").toUpperCase()}` : p;
}
