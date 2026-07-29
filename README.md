# gumline

A prototype AI-assisted **denial triage queue** for dental insurance billing.

It demonstrates one interaction: a biller sees denied claims ranked and classified, with
the system's reasoning visible on every one, and takes a different action depending on how
each claim was classified.

## The point

Three denied claims come back with the **identical denial code (CARC 50)** from the same
payer, on the same procedure, from the same provider, in the same week. To any existing
billing software they are the same claim three times over. gumline reads the clinical chart
note attached to each and reaches three different conclusions:

| Claim | Chart note | Classification | Action |
| --- | --- | --- | --- |
| `CLM-88214` | Pocket depths, bleeding sites, bone loss, failed prior therapy | Strong · high confidence | Draft an appeal |
| `CLM-88215` | Borderline findings, note hedges toward monitoring | Ambiguous · **low confidence** | Route to a human |
| `CLM-88213` | Maintenance visit, no clinical findings | Weak · high confidence | Recommend write-off |

Plus `CLM-88301`, an Administrative denial (CARC 16 / RARC N264) with a deterministic
correction path — a missing NPI that the provider roster can supply.

**The argument: the right amount of human oversight depends on the claim, and the system
should show its reasoning rather than hide it behind a score.** The low-confidence claim
is not a failure state — it is the system correctly declining to be certain, and it is
given the most visual weight in the queue rather than the least.

## Running it

```bash
npm install
npm run dev
```

In dev, a set of assertions covering the join and the deadline override runs on load and
logs to the browser console (`gumline self-check — 19/19 passed`).

```bash
npm run build     # typecheck + production build
```

## Demo script

1. **Open the queue.** Four denials, ranked. Point out that three share CARC 50 — the
   rationale line under each one is doing work no denial code could.
2. **`CLM-88214` — the confident yes.** Open it. The reasoning comes before anything else
   on the page. All four medical-necessity criteria check green. Click *View drafted
   appeal* — then note that the submit button was disabled until the draft was opened.
3. **`CLM-88215` — the unsure case.** This is the one to spend time on. Low confidence,
   amber, visually separated, second in the queue. No draft was written. The panel says
   what a human needs to check and why the system stopped.
4. **`CLM-88301` — the correction.** The proposed field change is shown as a before/after
   diff with its source of truth. *Approve & resubmit* moves it out of the actionable
   queue into "Submitted — awaiting payer response."
5. **`CLM-88213` — the write-off.** Same denial code as step 2, opposite conclusion, and
   the reasoning says exactly why.

Nothing in the app submits anything without an explicit click. That is a product
principle, not a prototype shortcut.

## How it works

No backend, no database, no persistence, no auth, no network calls. Two mock feeds get
joined and ranked in the browser; state lives in React and resets on reload.

```
src/
  data/
    mockPmsRecords.ts      Feed 1 — practice management system (incl. chart notes)
    mock835Records.ts      Feed 2 — 835 remittance advice (payer's denial codes)
    mockClassifications.ts Pre-computed classifier output, one per claim
    payerPolicy.ts         Tiny hand-authored payer rules (filing windows)
  lib/
    joinFeeds.ts           Join on patient_control_number, with a fallback key
    prioritize.ts          Deterministic ranking — no model involved
    dates.ts               Pinned DEMO_TODAY and date helpers
    selfCheck.ts           Dev-only assertions for the join and the ranking
  components/              Triage queue and claim detail screens
```

### The join

The two feeds match on `patient_control_number`, the value the payer echoes back. When
that is missing or doesn't line up — which happens in reality, because control numbers get
truncated, re-keyed, and dropped — the join falls back to `patient_id + date_of_service +
procedure_code` and marks the result `fallback_matched`. A fallback match is an assumption,
so it is flagged in the UI rather than passed off as clean. Records that match nothing stay
in the result set as `unmatched` instead of disappearing.

The fallback runs as a **second pass**, after every control-number match is settled, so the
result never depends on the order the feeds arrive in. It matches **one-to-one or not at
all**: D4341 is billed per quadrant, so patient + date + procedure is not a unique key in
dentistry, and where two records collide the join reports no match rather than picking one.
A wrong match that looks clean is worse than an honest gap.

Remittances that match no PMS record come back separately as `unmatchedRemittances` rather
than in the claim list — there is no chart note or patient to render, so they aren't claims,
but they aren't dropped either.

### The ranking

Deterministic, not a model. Two rules:

1. A closing filing deadline is a **hard override** — anything inside the window floats to
   the top regardless of dollar value.
2. Everything else sorts on billed amount discounted by documentation strength.

Deadline pressure only applies where a payer-facing filing is actually still on the table,
so a claim recommended for write-off doesn't advertise urgency the ranking won't act on.
Every claim carries a **rationale string** explaining its own position — `"Strong
documentation match · appeal deadline in 11 days · draft prepared"` — because a single
opaque priority number would sort the list correctly and tell the biller nothing.

Current ranking with the seed data:

```
CLM-88214 (draft appeal) → CLM-88215 (human review) → CLM-88301 (correction) → CLM-88213 (write-off)
```

### Dates

Every date is measured against `DEMO_TODAY` in [`src/lib/dates.ts`](src/lib/dates.ts),
pinned so Claim B's appeal deadline always reads 11 days out. A live clock would drift and
eventually render the seed claims expired, breaking the deadline-override story a few weeks
after it was built. Change that one constant to re-point the whole demo.

## Deliberately out of scope

Real product concerns, cut for a prototype:

- Real PMS, clearinghouse, or imaging integrations
- Auth, multi-user, persistence
- The Documentation bucket's imaging-retrieval path — needs a third integration, a known gap
- Repeat-denial and re-denial handling
- A real maintenance model for the payer policy table
- Live LLM classification — the classifier outputs here are fixed mock data
