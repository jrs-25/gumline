# Documentation

Two documents with different lifecycles. Knowing which is which matters before you edit
either one.

| Document | What it is | Lifecycle |
| --- | --- | --- |
| [`build-spec.md`](build-spec.md) | The original prototype build spec — the brief the first commit was built from | **Frozen.** Do not edit |
| [`system-diagram.md`](system-diagram.md) | Inputs and outputs under the hood: data flow, stage-by-stage contracts, what is real versus mocked | **Living.** Should track the code |

## `build-spec.md` is a historical record

It is kept byte-for-byte as it was handed over. Its value is that it shows what was asked
for, which only stays useful if nobody quietly reconciles it with what was built. If the
implementation should change, change the implementation — not the spec.

That means the spec will drift from the code over time, on purpose. The divergences below
are the current set.

## Known divergences from the spec

Each is deliberate and traceable to a Linear issue.

- **`Era835Record` carries `patient_id`, `date_of_service`, and `procedure_code`.** The
  spec's Feed 2 omits all three, which made the fallback join the spec itself requires
  (primary on control number, fallback on patient + date + procedure) impossible to
  implement correctly — there was nothing on the remittance side to compare against. A real
  835 does carry this detail at service-line level, so the widened type is the more faithful
  mock. See GUM-42.
- **`match_key` is nullable.** The spec's union is
  `"patient_control_number" | "patient_id+dos+procedure"`, but an unmatched record was
  matched on no key at all, and reporting a stale one would be a lie.
- **`joinFeeds` returns `{ claims, unmatchedRemittances }`,** not a bare array. A remittance
  with no PMS record has no chart note, patient, or billed amount, so it cannot be rendered
  as a claim — but it should not be silently dropped either. See GUM-43.
- **The appeal draft is editable,** with a save indicator and a revert. The spec called for a
  static mock string. See GUM-45 and GUM-46.
- **Claim D has a chart note.** The spec marked it "not central here."
- **Dates are measured against a pinned `DEMO_TODAY`,** not the real clock, so the
  deadline-override story does not decay as the real date moves past the seed data.

The four seed claims themselves conform to the spec exactly — 67 fields checked, zero
divergent. See GUM-40.

## Everything else

Running the prototype, the demo script, and the deliberate out-of-scope list live in the
[root README](../README.md). Issue-level history and decisions live in the Linear project.
