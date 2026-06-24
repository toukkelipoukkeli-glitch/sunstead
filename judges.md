# Sunstead Hack — Aiven challenge judges

Three Aiven people on the floor at Sunstead (Levi, Lapland, June 24–26 2026). All from the
**product / startup-program / business** side — **none are infra engineers**. Pitch
[idea.md](idea.md) to *them*: money, founders, adoption, and a real-but-playful MCP demo — not a
deep infra lecture.

> **Read the whole room with one line:** Aiven's new mission (CEO Oskari Saarenmaa) is
> **"Stop Managing. Start Building."** — "no longer just a data infrastructure platform… the best
> platform to build production applications and AI agents." Our idea *is* that slogan executed.
> Lead with it.

> **Lovable is a co-sponsor** (with Anthropic, Vercel, ElevenLabs). Frame: **"Lovable builds, Aiven
> runs"** — a handoff at the moment of success, not an escape from Lovable.

---

## Stanislav Dmitriev — Product Director, "Aiven Context"

*Tagline: "Helping Tech Teams build Context for Humans and AI." Helsinki. Presented the Aiven
challenge at Sunstead.*

**Who he is.** The product/technical-product judge and the one who framed the challenge:
*"build agentic workflows on top of Aiven Infra using our recently released MCP server."* Calls
himself a "data-driven marketeer with a technical background and a passion for product
development." Runs the **"Context is King"** meetup series. Background is **presales + prototyping**
(Ellie.ai: Head of Prototyping & Presales; "creating a new category — Data Product design"),
serial founder (Surrogate.tv, raised ~$2.5M; Corgi for Feedly — growth-hacked to 50k installs on
$0), and a **Junction'18 hackathon winner**. Vibe-codes satirical side-projects for fun
(stalin-ai.com).

**What he rewards.**
- **Context-maxing** — his signature thesis: *"stop token-maxing, start context-maxing… 60% of the
  work is building the exact, relevant context."* Mirror his words.
- **MCP depth** — it's literally the challenge. The Aiven MCP must be load-bearing, not cosmetic.
- **Real, polished, slightly playful prototypes** — he's a presales/prototyping person and a
  hackathon winner; a clean live demo lands harder with him than slides.
- **Category/product thinking** — he created a data category; he likes "this is a new product," not
  "this is a feature."

**Say to him:** *"The agent maxes the context of a real running app — its schema, its data, its
traffic, its bill — and turns that context into the right Aiven stack and a live stream of
next-best actions. The Aiven MCP isn't a checkbox: its output is the connection string the migrated
app actually runs on."*

**The one-up (he'll respect that we read the stack):** *"Your own Lovable integration still keeps
Supabase in the loop as the edge-function middleware. Our agent removes Supabase entirely — moves
the data with `aiven-db-migrate` and redeploys the glue as an **Aiven App** next to the DB. 100%
Aiven, and both steps are MCP calls."*

---

## Daniil Freidin — Junior Startup Program Manager (Aiven for Startups)

*Ex-Slush (Partnership Manager, €1M+ partner revenue) & Junction (Head of Global Operations).
Helsinki.*

**Who he is.** Runs partnerships/onboarding for **Aiven for Startups** — brings startups in via
VCs/accelerators and walks them application → onboarding → adoption → graduation. Self-described
mission: help founders *"scale with confidence and the necessary support."* Pure
**business / partnerships / ecosystem** lens; came up through the Nordic startup scene.

**What he rewards.**
- **Real value to founders** and **adoption** — does this actually help a startup, and will they
  stick?
- **Land-and-expand** — the program's whole model; he'll instantly recognize the migrator as
  top-of-funnel.
- **Ecosystem fit** — he thinks in terms of programs, credits, and founder journeys.

**Say to him:** *"This is top-of-funnel for Aiven for Startups. It lands the account at the exact
moment a vibe-coded app is scaling and the founder is scared — one click moves them onto Aiven,
cheaper, and the CTO agent keeps expanding their footprint as they grow. It's your program's
land-and-expand, automated, and it plugs straight into the $100K credits."*

---

## Julie Bastien — Startup Program Manager & Sustainability / GreenOps Lead

*Paris. Runs Aiven for Startups end-to-end and leads Aiven's sustainability strategy; lecturer at
ESCP; ex sustainable-finance/ESG consultant.*

**Who she is.** Co-runs **Aiven for Startups** (selection, onboarding, mentoring; organizes the
300+ annual hackathon) **and** owns sustainability — built Aiven's **carbon-footprint feature that
shows project emissions free in the console** ("GreenOps"). Offers up to **$100K credits**. Her
recent writing is markedly **production-minded**, not hype: *"we've crossed from convince-people-AI-
matters into make-it-actually-work-in-production… less keynote, more shipping."*

**What she rewards / worries about.** From her own posts, the open questions she cares about:
- *"How do you reduce token/cost without degrading output quality?"* → **cost efficiency.**
- *"Where's the line between AI autonomy and human validation?"* → she's wary of fully-autonomous
  agents.
- *"How do you build trust into a system that can confidently hallucinate?"* → **trust / verification.**

**Say to her (hit all three):** *"The migration isn't blind autonomy — it **verifies** itself: row
counts match before and after, the app boots against Aiven, queries return the same result. That's
human-checkable validation built into the loop, not a hope. And the CTO agent surfaces **cost and
carbon** — it can read Aiven's own in-console emissions, so 'what should I do next' includes the
greener, cheaper move."* The carbon angle is uniquely hers — use it.

---

## One-paragraph synthesis (if you only get to prep once)

Open with **"Stop Managing. Start Building"** — Aiven's own mission, executed for the Lovable wave.
**Stanislav** needs the **MCP to be real and the context-maxing framing explicit**; give him a
clean, slightly playful live migration. **Daniil** needs the **founder-value / land-and-expand /
top-of-funnel-for-the-startup-program** story. **Julie** needs **production-realism, cost
efficiency, verification (trust), and the carbon angle**. All three share the startup-program lens,
so the through-line is: *every migration is an account landed, every CTO suggestion is consumption
expanded — automated.*
