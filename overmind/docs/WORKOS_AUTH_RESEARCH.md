# WorkOS Auth for Aiven Overmind — Feasibility Research

**Question:** Can we use WorkOS as Overmind's auth layer *specifically so AI agents — not just humans — can sign up for and authenticate programmatically* (M2M / autonomous onboarding, no browser)?

**VERDICT: ✅ Yes — genuinely supported.** WorkOS has first-class machine-to-machine auth (**M2M Applications**, OAuth 2.0 client-credentials) plus a brand-new open protocol (**auth.md**, May 2026) built precisely for agents to *self-register* and authenticate with no browser, no email round-trip, no human. Humans still get AuthKit (hosted login). This is one of the few auth vendors where "an agent signs up and gets a token by itself" is an actual product feature, not a hack.

> One caveat: I researched this from WorkOS docs/blogs, I have not run the integration. Exact SDK method names for *creating* an M2M app via API were not fully documented in public pages (you create them in the dashboard, or via the dashboard/management API); everything else below is concrete.

---

## 1. Programmatic user creation (no browser) — YES

`POST /user_management/users` creates a user directly via API key, no browser flow. "Only unmanaged users can be created directly using the User Management API" — which is exactly what we want for headless/imported accounts.

- **Endpoint:** `POST /user_management/users`
- **Auth:** server-side WorkOS API key (`sk_...`)
- **Params:** `email` (required); optional `first_name`, `last_name`, `password` *or* `password_hash` (+ `password_hash_type`: bcrypt/scrypt/argon2/…), `email_verified`, `metadata`, `external_id`
- **Node SDK:** `workos.userManagement.createUser({ email, password, emailVerified: true })`

This is the path for migrating existing Supabase/Lovable users into WorkOS (map old hashes via `password_hash` + `password_hash_type`).

Source: [Create User API reference](https://workos.com/docs/reference/user-management/user/create)

## 2. Machine-to-machine / non-human auth — YES (two options)

WorkOS gives you **two** distinct M2M credential models ([API Keys vs M2M Applications](https://workos.com/blog/api-keys-vs-m2m-applications)):

| | **API Keys** | **M2M Applications** (recommended for agents) |
|---|---|---|
| Credential | One opaque long-lived secret | `client_id` + `client_secret` → exchanged for short-lived JWTs |
| Token | The key itself | OAuth2 **client_credentials** → JWT access token (`expires_in: 3600`) |
| Validation | Lookup/introspection | **JWKS** signature verify (offline) or Token Introspection API |
| Scoping | Coarse | Per-app, carries `org_id` claim, scopes |
| Revocation | Revoke the key | Revoke the client's credentials — short tokens expire fast |
| Best for | Simple server-to-server | **Per-agent identity** with audit + revocation |

**The exact feature to name in the demo: "WorkOS M2M Applications" using the OAuth 2.0 client-credentials grant.** Each agent = its own M2M client (`client_id`/`client_secret`); compromise one and you revoke *its* credentials only, no user sessions touched.

How an agent gets a token (verbatim from WorkOS):
```javascript
const params = new URLSearchParams({
  grant_type: 'client_credentials',
  client_id: process.env.M2M_APP_CLIENT_ID,
  client_secret: process.env.M2M_APP_CLIENT_SECRET,
  // scope: 'openid profile email',
});

const { access_token } = await fetch(
  'https://<your-subdomain>.authkit.app/oauth2/token',
  { method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params },
).then(r => r.json());
```
The JWT contains an **`org_id`** claim (the customer/org the agent acts for) plus standard `sub`, `aud`, `exp`, `iat`.

Sources: [M2M Applications docs](https://workos.com/docs/authkit/connect/m2m) · [Client Credentials guide](https://workos.com/guide/client-credentials)

## 3. "Auth for AI agents" — YES, and they lead with it (2026)

WorkOS has explicitly positioned itself as agent-auth infrastructure as of 2026. Two things to know:

**(a) Agent-credentials guidance** — their stated philosophy:
> "An agent is not an extension of the user. It's a new category of actor in your system that needs its own identity, its own credentials, and its own permission boundaries."

Pattern: each agent is registered as its own M2M client; AuthKit issues tokens *scoped narrower than the user's own permissions*; FGA (Fine-Grained Authorization) enforces per-tool boundaries at call time. Source: [Securing agentic apps — give AI agents their own credentials](https://workos.com/blog/ai-agent-credentials).

**(b) auth.md — open agent *registration* protocol (this is the headline-grabber).** Released May 2026, this is the part that maps directly onto "agents sign themselves up." It's an open protocol (a `auth.md` markdown file at your domain + a few HTTP endpoints) letting agents discover, register, and authenticate **with no browser, no signup form, no OAuth consent screen.** Built on RFC 9728 (discovery) + IETF ID-JAG draft (delegation) + OIDC backchannel logout (revocation). It is *not* WorkOS-locked.

Two flows:
- **Agent Verified (synchronous, zero human):** the agent's provider (OpenAI/Anthropic/Cursor) attests the user via an **ID-JAG** token; the agent `POST`s it to your `/agent/auth` endpoint; you verify the signature against the provider's JWKS and return credentials **synchronously — "no OTP, no email round-trip, no human interaction required."**
- **User Claimed (OTP):** agent self-registers with limited scope immediately, user later binds it by reading a one-time code from email back to the agent (`/agent/auth/claim` → `/agent/auth/claim/complete`).

Discovery is two-hop: a 401 returns `WWW-Authenticate` → Protected Resource Metadata at `/.well-known/oauth-protected-resource` → Authorization Server metadata with an `agent_auth` block.

Sources: [auth.md landing](https://workos.com/auth-md) · [Agent Registration with auth.md](https://workos.com/blog/agent-registration-with-auth-md) · [auth.md GitHub](https://github.com/workos/auth.md/) · [MarkTechPost coverage](https://www.marktechpost.com/2026/05/25/workos-releases-auth-md-an-open-agent-registration-protocol-built-on-oauth-standards/)

## 4. Token model — what the agent presents & how Overmind verifies

- **Token the agent presents:** a short-lived JWT (1h default) obtained via client-credentials, sent as `Authorization: Bearer <jwt>`.
- **How Overmind verifies (no WorkOS round-trip):** fetch the environment **JWKS** once, cache it, verify the JWT signature + `exp`/`aud`/`iss` locally. Optionally call the **Token Introspection API** if you need synchronous revocation checks.
- **Sessions/expiry:** access token expires in ~3600s; the agent just re-runs client-credentials to mint a new one (the `client_secret` is long-lived). No refresh-token dance needed for M2M.
- Claims you'll branch on: `sub` (agent identity), `org_id` (tenant), `exp`, scopes.

## 5. Integration path for our stack (Hono + Node TS, ESM)

Overmind is Hono + `@hono/node-server` + `pg` + Anthropic SDK, ESM/tsx. Concrete wiring:

```bash
npm i @workos-inc/node jose
# jose = standard JWKS/JWT verification; WorkOS Node SDK for user-mgmt calls
```

**Env vars:**
```
WORKOS_API_KEY=sk_...
WORKOS_CLIENT_ID=client_...           # AuthKit / app client id
WORKOS_M2M_CLIENT_ID=...              # per-agent, or one shared service client
WORKOS_M2M_CLIENT_SECRET=...
WORKOS_JWKS_URL=https://<subdomain>.authkit.app/oauth2/jwks  # or from AS metadata
WORKOS_TOKEN_URL=https://<subdomain>.authkit.app/oauth2/token
```

**Hono middleware to verify an agent's bearer JWT** (replaces the HMAC `verifyToken` in `demo/pulsewall-aiven/server/auth.ts`):
```ts
import { createRemoteJWKSet, jwtVerify } from 'jose'
import type { MiddlewareHandler } from 'hono'

const JWKS = createRemoteJWKSet(new URL(process.env.WORKOS_JWKS_URL!))

export const requireAgent: MiddlewareHandler = async (c, next) => {
  const auth = c.req.header('authorization')
  const token = auth?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token) return c.json({ error: 'no token' }, 401)
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      // issuer/audience from your AuthKit env
    })
    c.set('agent', { sub: payload.sub, orgId: payload.org_id })
    await next()
  } catch {
    return c.json({ error: 'invalid token' }, 401)
  }
}
```

**How an agent obtains its token** = the client-credentials `fetch` in §2 (drop straight into an Overmind agent's startup).

**Creating users/accounts programmatically** (for the migration side):
```ts
import { WorkOS } from '@workos-inc/node'
const workos = new WorkOS(process.env.WORKOS_API_KEY)
await workos.userManagement.createUser({ email, password, emailVerified: true })
```

## 6. Hackathon viability

- **Free tier is generous:** AuthKit/User Management free up to **1M MAUs** (then $2,500/1M). Email/password, social login, MFA all included free. ([Pricing](https://workos.com/pricing))
- **Cost watch-outs (not needed for a demo):** Enterprise SSO is *per-connection* ($125/mo+), Audit Logs $5/org/mo, custom domains $99/mo. None required for M2M/agent auth in a hackathon — public M2M pricing wasn't clearly listed, so confirm M2M app limits on the free tier before relying on hundreds of agent clients.
- **Time-to-integrate:** Realistically **2–4 hours** for the M2M happy path — create an M2M app in the dashboard, copy `client_id`/`client_secret`, add the ~20-line `jose` middleware above, have an agent fetch a token. **Implementing the full auth.md self-registration protocol is bigger** (PRM discovery + ID-JAG verification + claim endpoints) — closer to a day, and only worth it if "the agent registers *itself* live on stage" is the wow moment.

## 7. Verdict + recommendation

**"Agents sign up via WorkOS" is genuinely supported** — more than at any competitor — via M2M Applications (auth) and auth.md (self-registration). Recommended split:

- **Use WorkOS M2M Applications for agent → Overmind API auth.** Each Overmind agent gets its own `client_id`/`client_secret`, mints short JWTs via client-credentials, Overmind verifies via JWKS. This *replaces* the HMAC tokens in `auth.ts` and is the realistic, demoable scope for ~24h. Strong story: "agents are first-class actors with revocable per-agent identities."
- **Use WorkOS AuthKit for human login** (the Overmind dashboard) — free, hosted, ~30 min.
- **For the "agent self-onboards" wow:** if you have time, implement a *minimal* auth.md User-Claimed flow (agent self-registers with limited scope, no provider integration needed) — it's the most novel/demo-friendly piece and directly on-theme for an autonomous-agent product. If time is tight, **skip auth.md** and just pre-provision M2M clients; the M2M path alone already delivers "agents authenticate programmatically, no human."
- **Keep our own scoped API-key issuance as the fallback** if WorkOS M2M setup friction bites mid-hackathon — issuing our own per-agent scoped keys (extend the existing `auth.ts` pattern) achieves "agents self-onboard + authenticate" in ~1h with zero external dependency. WorkOS is the *better, more impressive* answer; our own keys are the safe floor.

**Bottom line:** Yes, WorkOS does this. Wire **M2M Applications + JWKS verify** for the demo (2–4h), mention **auth.md** as the cutting-edge self-registration story (build it only if time allows), and keep our own scoped-key issuance as a one-hour safety net.

---

### Sources
- [WorkOS User Management overview / AuthKit](https://workos.com/docs/user-management/overview)
- [Create User API reference](https://workos.com/docs/reference/user-management/user/create)
- [M2M Applications docs](https://workos.com/docs/authkit/connect/m2m)
- [API Keys vs M2M Applications (blog)](https://workos.com/blog/api-keys-vs-m2m-applications)
- [OAuth 2.0 Client Credentials guide](https://workos.com/guide/client-credentials)
- [Securing agentic apps — AI agent credentials](https://workos.com/blog/ai-agent-credentials)
- [The developer's guide to AI agent auth](https://workos.com/blog/developers-guide-to-ai-agent-authentication-and-authorization)
- [auth.md — open agent registration protocol](https://workos.com/auth-md)
- [Agent Registration with auth.md (blog)](https://workos.com/blog/agent-registration-with-auth-md)
- [auth.md on GitHub](https://github.com/workos/auth.md/)
- [MarkTechPost — WorkOS releases auth.md](https://www.marktechpost.com/2026/05/25/workos-releases-auth-md-an-open-agent-registration-protocol-built-on-oauth-standards/)
- [WorkOS Pricing](https://workos.com/pricing)
