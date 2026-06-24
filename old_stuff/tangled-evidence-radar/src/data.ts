export type Bucket = "review" | "context" | "batch";

export type EvidenceKind =
  | "identity"
  | "trust"
  | "pull"
  | "issue"
  | "comment"
  | "spindle"
  | "repo";

export type Evidence = {
  kind: EvidenceKind;
  label: string;
  value: string;
  note: string;
  weight: number;
};

export type WorkItem = {
  id: string;
  rank: number;
  title: string;
  type: "Pull request" | "Issue";
  bucket: Bucket;
  status: string;
  author: string;
  authorDid: string;
  score: number;
  reason: string;
  action: string;
  files: string[];
  evidence: Evidence[];
};

export const repo = {
  maintainer: "Mira",
  maintainerHandle: "@mira.tangled.sh",
  maintainerDid: "did:plc:mira-maintainer",
  name: "solar-knot/payments",
  did: "did:plc:repo-solar-payments",
  knot: "knot.helsinki.dev",
  branch: "main",
  release: "v1.4.0 release candidate",
};

const sharedTopEvidence: Evidence[] = [
  {
    kind: "identity",
    label: "Identity",
    value: "did:plc:jules-vouched",
    note: "@jules.dev resolves to a stable contributor DID.",
    weight: 20,
  },
  {
    kind: "trust",
    label: "Vouch",
    value: "at://did:plc:mira-maintainer/sh.tangled.graph.vouch/jules",
    note: "Mira and two maintainers vouch for this contributor.",
    weight: 20,
  },
  {
    kind: "issue",
    label: "Issue",
    value: "at://did:plc:sana-security/sh.tangled.repo.issue/payments-91",
    note: "Security issue #91 blocks the release candidate.",
    weight: 35,
  },
  {
    kind: "spindle",
    label: "Spindle",
    value: "spindle://knot.helsinki.dev/solar-knot/payments/runs/8821",
    note: "Only the webhook signature window test is failing.",
    weight: 25,
  },
  {
    kind: "comment",
    label: "Comment",
    value: "at://did:plc:sana-security/sh.tangled.feed.comment/comment-552",
    note: "Security maintainer accepted a five minute replay window.",
    weight: 15,
  },
  {
    kind: "pull",
    label: "Pull",
    value: "at://did:plc:jules-vouched/sh.tangled.repo.pull/payments-184",
    note: "Round 3 changed one file and one focused test.",
    weight: 10,
  },
];

export const workItems: WorkItem[] = [
  {
    id: "pr-184",
    rank: 1,
    title: "PR #184: Harden webhook signature verification",
    type: "Pull request",
    bucket: "review",
    status: "Review now",
    author: "@jules.dev",
    authorDid: "did:plc:jules-vouched",
    score: 105,
    reason: "Vouched author + failing spindle + release-blocking security issue",
    action: "Ask for one small test fix, then merge.",
    files: [
      "src/webhooks/verify.ts",
      "src/payments/replay-window.ts",
      "tests/webhooks/verify.test.ts",
    ],
    evidence: sharedTopEvidence,
  },
  {
    id: "issue-91",
    rank: 2,
    title: "Issue #91: Webhook replay risk before v1.4.0",
    type: "Issue",
    bucket: "review",
    status: "Review now",
    author: "@sana.sec",
    authorDid: "did:plc:sana-security",
    score: 88,
    reason: "Vouched security reporter + active comments + linked top PR",
    action: "Keep issue open until PR #184 passes spindle.",
    files: ["src/webhooks/verify.ts"],
    evidence: [
      {
        kind: "identity",
        label: "Identity",
        value: "did:plc:sana-security",
        note: "@sana.sec resolves to a vouched security maintainer DID.",
        weight: 20,
      },
      {
        kind: "issue",
        label: "Issue",
        value: "at://did:plc:sana-security/sh.tangled.repo.issue/payments-91",
        note: "Release-blocking security issue with active discussion.",
        weight: 35,
      },
      {
        kind: "comment",
        label: "Comment",
        value: "at://did:plc:mira-maintainer/sh.tangled.feed.comment/comment-560",
        note: "Maintainer confirms this blocks the release candidate.",
        weight: 15,
      },
      {
        kind: "pull",
        label: "Linked PR",
        value: "at://did:plc:jules-vouched/sh.tangled.repo.pull/payments-184",
        note: "PR #184 is the active fix path.",
        weight: 10,
      },
    ],
  },
  {
    id: "pr-186",
    rank: 3,
    title: "PR #186: Add Danish locale strings",
    type: "Pull request",
    bucket: "batch",
    status: "Safe to batch",
    author: "@lina.dev",
    authorDid: "did:plc:lina-known",
    score: 24,
    reason: "Known contributor + passing spindle + copy-only changes",
    action: "Batch after release-critical work is cleared.",
    files: ["locales/da.json"],
    evidence: [
      {
        kind: "identity",
        label: "Identity",
        value: "did:plc:lina-known",
        note: "Known contributor with no risk flags.",
        weight: 10,
      },
      {
        kind: "spindle",
        label: "Spindle",
        value: "spindle://knot.helsinki.dev/solar-knot/payments/runs/8830",
        note: "All checks pass.",
        weight: -10,
      },
      {
        kind: "pull",
        label: "Pull",
        value: "at://did:plc:lina-known/sh.tangled.repo.pull/payments-186",
        note: "Locale-only patch.",
        weight: -15,
      },
    ],
  },
  {
    id: "pr-187",
    rank: 4,
    title: "PR #187: Replace checkout session cache",
    type: "Pull request",
    bucket: "context",
    status: "Needs context",
    author: "@niko.dev",
    authorDid: "did:plc:niko-new",
    score: 42,
    reason: "First-time contributor + payment cache touched + passing tests",
    action: "Ask Mira to route this to a payments reviewer.",
    files: ["src/payments/session-cache.ts", "tests/payments/cache.test.ts"],
    evidence: [
      {
        kind: "identity",
        label: "Identity",
        value: "did:plc:niko-new",
        note: "First-time contributor with no vouch record yet.",
        weight: -20,
      },
      {
        kind: "spindle",
        label: "Spindle",
        value: "spindle://knot.helsinki.dev/solar-knot/payments/runs/8832",
        note: "Tests pass, but touched files are high-risk.",
        weight: 5,
      },
      {
        kind: "pull",
        label: "Pull",
        value: "at://did:plc:niko-new/sh.tangled.repo.pull/payments-187",
        note: "Cache replacement needs domain review.",
        weight: 15,
      },
    ],
  },
  {
    id: "issue-93",
    rank: 5,
    title: "Issue #93: Knot deploy docs mention old env var",
    type: "Issue",
    bucket: "batch",
    status: "Safe to batch",
    author: "@cam.docs",
    authorDid: "did:plc:cam-docs",
    score: 12,
    reason: "Docs-only + no release impact + no linked PR",
    action: "Batch after the release freeze.",
    files: ["docs/knot-deploy.md"],
    evidence: [
      {
        kind: "issue",
        label: "Issue",
        value: "at://did:plc:cam-docs/sh.tangled.repo.issue/payments-93",
        note: "Valid docs issue without release impact.",
        weight: -15,
      },
      {
        kind: "repo",
        label: "Repo",
        value: "did:plc:repo-solar-payments",
        note: "Repository identity remains stable across knots.",
        weight: 0,
      },
    ],
  },
  {
    id: "pr-188",
    rank: 6,
    title: "PR #188: Refactor billing adapter naming",
    type: "Pull request",
    bucket: "batch",
    status: "Safe to batch",
    author: "@rae.bot",
    authorDid: "did:plc:rae-bot",
    score: 8,
    reason: "Cosmetic change + no failing evidence + no active discussion",
    action: "Skip during judge demo.",
    files: ["src/billing/adapter.ts"],
    evidence: [
      {
        kind: "pull",
        label: "Pull",
        value: "at://did:plc:rae-bot/sh.tangled.repo.pull/payments-188",
        note: "Automated cosmetic refactor.",
        weight: -10,
      },
      {
        kind: "spindle",
        label: "Spindle",
        value: "spindle://knot.helsinki.dev/solar-knot/payments/runs/8834",
        note: "All checks pass.",
        weight: -10,
      },
    ],
  },
];

export const bucketLabels: Record<Bucket, string> = {
  review: "Review now",
  context: "Needs context",
  batch: "Safe to batch",
};
