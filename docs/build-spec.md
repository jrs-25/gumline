# gumline — Prototype Build Spec (for Claude Code)

## What this is

A demo prototype for a Principal PM case study. It demonstrates one core interaction: an AI-assisted **denial triage queue** for dental insurance billing. A biller sees denied claims ranked and classified, with a visible rationale per claim, and takes different actions depending on how the system classified each one.

This is a **demo, not production**. All data is mocked. There are no real integrations, no database, no auth, no payer/clearinghouse/PMS connections. Optimize for a clean, legible, clickable demo that tells the story below — not for scale, persistence, or edge-case completeness.

## The story the demo has to tell

Three denied claims come back with the **identical denial code (CARC 50)** from the same payer. To any existing billing software they look the same. gumline reads the clinical chart note attached to each and classifies them differently:

- **Claim A** — thin documentation → confident "not winnable" → recommend write-off
- **Claim B** — strong documentation → confident "winnable" → draft an appeal
- **Claim C** — ambiguous documentation → low confidence → route to human review (the "agent is unsure" case)

Plus one **Administrative** claim (different code) that demonstrates a lower-stakes correction path.

The point being demonstrated: **the right amount of human oversight depends on the claim, and the system makes its reasoning visible rather than hiding it behind a score.**

---

## Tech stack

- **Single-page React app** (Vite + React, or Next.js — your call, keep it simple)
- **Tailwind** for styling
- **No backend.** Mock data lives in local JSON/TS files. All "agent" logic runs client-side against that mock data.
- **No database, no localStorage/sessionStorage** — hold state in React state only
- **No real LLM calls required for the core demo.** The classification outputs are pre-computed mock data (see below). *Optional stretch:* a "re-run classification" button that calls an LLM live — gate this behind a clear flag so the demo works fully without it.

---

## Data model

Two mock source feeds that get **joined on `patient_control_number`**, plus the joined result. Model all three explicitly — the join is part of what the demo shows.

### Feed 1 — PMS records (`mockPmsRecords`)
```ts
{
  patient_control_number: string;   // join key
  patient_id: string;
  patient_name: string;
  procedure_code: string;           // e.g. "D4341"
  procedure_desc: string;
  date_of_service: string;          // ISO date
  provider: string;
  billed_amount: number;
  chart_note: string;               // free text — the thing the "agent" reads
  // optional, for the Documentation/Administrative examples:
  imaging_refs?: string[];
}
```

### Feed 2 — 835 remittance records (`mock835Records`)
```ts
{
  patient_control_number: string;   // join key, echoed back by payer
  payer_claim_control_number: string;
  payer_id: string;
  carc_code: string;                // e.g. "50"
  carc_description: string;
  rarc_code: string | null;
  paid_amount: number;              // 0.00 for denials
  remittance_date: string;          // ISO date
}
```

### Joined result (`MatchedDenialRecord`) — produced by the join function
```ts
{
  claim_id: string;
  match_status: "matched" | "fallback_matched" | "unmatched";
  match_key: "patient_control_number" | "patient_id+dos+procedure";
  // ...all relevant fields from both feeds, flattened
}
```

### Classification output (`ClassificationResult`) — pre-computed mock, one per claim
```ts
{
  claim_id: string;
  category: "Administrative" | "Documentation" | "Clinical";
  documentation_match: "weak" | "strong" | "ambiguous" | "available_not_submitted" | null;
  confidence: "high" | "low";
  matched_elements: string[];
  missing_elements: string[];
  reasoning: string;                // human-readable, shown in UI — this is the "no black box" principle
  action: "recommend_writeoff_or_addendum" | "proceed_to_drafting"
        | "route_to_human_review" | "approve_correction";
  recommended_next_step: string;
}
```

---

## The four seed claims (use these exact values)

**Claim A — CLM-88213 — Clinical, confident NO**
- PMS: PMS-88213, PT-4471, "J. Alvarez", D4341, 2026-06-02, Dr. Osei, $285.00
- chart_note: `"Perio maintenance performed, patient tolerated well, return in 3 months."`
- 835: CARC 50, "Not deemed a medical necessity", paid 0.00, remit 2026-06-19
- Classification: category Clinical, documentation_match "weak", confidence "high", missing_elements ["pocket depths","bleeding on probing","radiographic evidence of bone loss","documented history of failed non-surgical therapy"], action "recommend_writeoff_or_addendum"

**Claim B — CLM-88214 — Clinical, confident YES**
- PMS: PMS-88214, PT-4472, "R. Chen", D4341, 2026-06-02, Dr. Osei, $310.00
- chart_note: `"5-6mm pockets, quadrants 2 and 3, bleeding on probing at 8 sites, radiographic evidence of horizontal bone loss, patient previously completed non-surgical therapy without resolution."`
- 835: CARC 50, "Not deemed a medical necessity", paid 0.00, remit 2026-06-19
- Classification: category Clinical, documentation_match "strong", confidence "high", matched_elements ["pocket depths recorded (5-6mm)","bleeding on probing (8 sites)","radiographic bone loss","failed prior therapy"], action "proceed_to_drafting"
- Add a computed appeal deadline ~11 days out from remittance for the prioritization display

**Claim C — CLM-88215 — Clinical, LOW confidence (the "unsure" case)**
- PMS: PMS-88215, PT-4473, "M. Okafor", D4341, 2026-06-03, Dr. Osei, $298.00
- chart_note: `"4-5mm pockets noted in quadrant 1, mild bleeding on probing at 3 sites. Patient reports occasional sensitivity. Recommend re-evaluation at next visit."`
- 835: CARC 50, "Not deemed a medical necessity", paid 0.00, remit 2026-06-20
- Classification: category Clinical, documentation_match "ambiguous", confidence "low", matched_elements ["pocket depths recorded (4-5mm)","bleeding on probing (limited: 3 sites)"], missing_elements ["radiographic evidence of bone loss","documented history of failed non-surgical therapy"], action "route_to_human_review", reasoning explaining findings are below typical SRP threshold

**Claim D — CLM-88301 — Administrative, correction path**
- PMS: PMS-88301, PT-4480, "L. Park", D2740, 2026-06-04, Dr. Osei, $1,150.00
- chart_note: (not central here)
- 835: CARC 16, RARC N264 ("missing/incomplete ordering provider NPI"), paid 0.00, remit 2026-06-21
- Classification: category Administrative, confidence "high", action "approve_correction", reasoning "Ordering provider NPI missing; correct value available in provider roster", plus a `corrected_value` field (mock NPI) and `source_of_truth: "provider_roster"`

---

## Core logic to implement

1. **Join function** — `joinFeeds(pmsRecords, era835Records): MatchedDenialRecord[]`
   - Primary match on `patient_control_number`
   - Fallback match on `patient_id + date_of_service + procedure_code` when the control number is missing/unmatched — set `match_status: "fallback_matched"` so it can be flagged in the UI
   - Anything still unmatched → `match_status: "unmatched"`, kept in the result set (not dropped)

2. **Prioritization (deterministic — NOT an LLM)** — `prioritize(claims): rankedClaims[]`
   - Deadline acts as a **hard override**: any claim within N days of its appeal deadline floats to the top regardless of other factors
   - Otherwise rank by a simple combination of billed amount and documentation strength
   - Produce a short **rationale string** per claim for display (e.g. "Strong documentation match · appeal deadline in 11 days · draft prepared") — do not surface a single opaque numeric score

3. **Classification** — for the core demo, just load the pre-computed `ClassificationResult` per claim from mock data. (Optional live-LLM version behind a flag — see stretch goals.)

---

## UI — screens

### Screen 1: Triage Queue (the main view)
A ranked list of claim rows. Each row shows:
- Claim ID (monospace) + category label (small, muted)
- A **status badge**, color-coded by action:
  - `approve_correction` → mint/green — "CORRECTION READY · AWAITING APPROVAL"
  - `proceed_to_drafting` → teal — "READY FOR REVIEW"
  - `route_to_human_review` → amber — "NEEDS HUMAN REVIEW"
  - `recommend_writeoff_or_addendum` → muted gray — "RECOMMEND WRITE-OFF"
- The prioritization rationale string
- A right-aligned action link matching the badge color ("Approve & resubmit →", "Review draft →", "Investigate →")

Ranking: deadline-override claims first, then by priority. The amber "needs review" claim should be **visually distinct** and clearly separated — not silently buried at the bottom.

### Screen 2: Claim Detail (opens when a row is clicked)
Shows the full picture for one claim:
- The joined record (both feeds, and the join key that matched them)
- The raw chart note
- The classification result with **`reasoning` shown prominently**, plus matched/missing elements as check/x lists
- The recommended next step
- For Claim B specifically: a **"View drafted appeal"** affordance (the drafted narrative can be a mock static string for the prototype — no live generation required)
- For Claim D: a **correction diff view** — "Ordering NPI: [blank] → [corrected value], sourced from provider roster" — with an "Approve & resubmit" confirm control

### Interaction requirements
- Clicking a status action should do something visible (e.g., Claim D's "Approve & resubmit" moves it to a "Submitted — awaiting payer response" state and removes it from the actionable queue). State changes are in-memory only.
- **Nothing auto-submits.** Every payer-facing action requires an explicit click. This is a core design principle of the product and should be true in the demo.

---

## Visual design

Match the deck's system so the prototype and slides feel like one product:
- Primary: teal `#028090`; supporting seafoam `#00A896`, mint `#02C39A`; accent amber `#C9822B` for the "needs review" state; ink `#212121`; muted `#6B6F72`
- Dark teal `#022E33` for any header/hero areas
- Rounded cards, subtle borders, light shadows — clean and calm, not busy
- No decorative accent stripes or color bars
- Legible at presentation distance: generous sizing, strong contrast

*(If using Claude Design for the visual layer first, this palette and the Screen 1 / Screen 2 structure above are the brief to hand it. Claude Code can then wire the logic behind the generated components.)*

---

## Explicitly OUT of scope for the prototype

Don't build these — they're real product concerns but out of scope for a 2-3 day demo. Note them as such if relevant:
- Real PMS / clearinghouse / imaging integrations
- Auth, multi-user, persistence
- The Documentation bucket's imaging-retrieval path (requires a third integration — a known gap)
- Repeat-denial / re-denial handling
- The Payer Policy Table's real maintenance model (hand-author a tiny lookup for the demo instead)
- Live LLM classification (optional stretch only)

---

## Build order (suggested)

1. Scaffold app + Tailwind + the palette as theme tokens
2. Mock data files: the four claims across both feeds + their classification results
3. `joinFeeds` + `prioritize` functions, with a couple of console assertions proving the join and the deadline-override behave correctly
4. Screen 1 (triage queue) rendering ranked, classified, badged rows
5. Screen 2 (claim detail) with the reasoning + matched/missing display
6. The two interactive moments: Claim B "view drafted appeal", Claim D "approve & resubmit → submitted"
7. Polish pass for presentation legibility

## Stretch goals (only if time)
- Live LLM classification: a "re-classify" button on the detail view that sends the chart note + CARC code to an LLM and renders the returned `ClassificationResult`. Must degrade gracefully to the mock data if not configured.
- A visible "unmatched / fallback-matched" claim in the queue to demonstrate the join's fallback path.
- A tiny "what the agent saw" panel showing the exact joined JSON that went into classification — reinforces the transparency theme.
