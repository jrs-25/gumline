import type { Era835Record, PmsRecord } from '../types'
import { mockPmsRecords } from '../data/mockPmsRecords'
import { mock835Records } from '../data/mock835Records'
import { mockOutcomes } from '../data/mockOutcomes'
import { joinFeeds } from './joinFeeds'
import { prioritize } from './prioritize'
import { DEADLINE_OVERRIDE_DAYS, DEMO_TODAY } from './dates'
import {
  byCarc,
  byPayer,
  canTransition,
  isInferred,
  outcomeIsConsistent,
  presumptionIsRipe,
  summarize,
} from './outcomes'

/**
 * Dev-only assertions covering the two pieces of logic the demo actually rests on:
 * that the join links the feeds the way it claims to, and that the deadline override
 * really does outrank a larger, cleaner claim. Runs on load in dev and logs a summary.
 */
export function runSelfCheck(): void {
  const results: Array<{ name: string; pass: boolean; detail: string }> = []

  const check = (name: string, pass: boolean, detail: string) => {
    results.push({ name, pass, detail })
    console.assert(pass, `✗ ${name} — ${detail}`)
  }

  // ── Join: the happy path ──────────────────────────────────────────────────
  const { claims: joined, unmatchedRemittances } = joinFeeds(mockPmsRecords, mock835Records)

  check(
    'join returns one row per PMS record',
    joined.length === mockPmsRecords.length,
    `expected ${mockPmsRecords.length}, got ${joined.length}`,
  )

  check(
    'every remittance is claimed when the feeds line up',
    unmatchedRemittances.length === 0,
    `${unmatchedRemittances.length} orphaned remittance(s)`,
  )

  check(
    'every seed claim matches on patient_control_number',
    joined.every((r) => r.match_status === 'matched' && r.match_key === 'patient_control_number'),
    joined.map((r) => `${r.claim_id}:${r.match_status}`).join(', '),
  )

  const claimB = joined.find((r) => r.claim_id === 'CLM-88214')
  check(
    'join carries both feeds onto one record',
    claimB?.chart_note.includes('5-6mm pockets') === true && claimB?.carc_code === '50',
    `chart_note from PMS + carc_code from 835 on ${claimB?.claim_id}`,
  )

  check(
    'the three CARC 50 claims are indistinguishable on the remittance alone',
    new Set(
      joined
        .filter((r) => r.carc_code === '50')
        .map((r) => `${r.payer_id}|${r.carc_code}|${r.carc_description}`),
    ).size === 1,
    'same payer, same code, same description — only the chart note differs',
  )

  // ── Join: the fallback path ───────────────────────────────────────────────
  // Payer drops the control number; the natural key has to carry the match.
  const pmsOrphan: PmsRecord[] = [{ ...mockPmsRecords[0], patient_control_number: 'PMS-99001' }]
  const eraNoControlNumber: Era835Record[] = [
    { ...mock835Records[0], patient_control_number: '' },
  ]
  const fallbackJoined = joinFeeds(pmsOrphan, eraNoControlNumber).claims
  check(
    'falls back to patient_id + DOS + procedure when the control number is gone',
    fallbackJoined[0]?.match_status === 'fallback_matched' &&
      fallbackJoined[0]?.match_key === 'patient_id+dos+procedure',
    `got ${fallbackJoined[0]?.match_status}`,
  )
  check(
    'fallback match still carries the payer data through',
    fallbackJoined[0]?.carc_code === '50',
    `carc_code = ${fallbackJoined[0]?.carc_code}`,
  )

  // ── Join: the fallback does not cross-match ───────────────────────────────
  // The regression this fixture exists for: an earlier implementation never
  // compared the candidate's natural key at all, so a control-number-less
  // remittance landed on whichever PMS record the scan reached first. Here that
  // put Meridian's crown denial onto a perio claim for a different patient.
  const crossMatchPms = [mockPmsRecords[0], mockPmsRecords[3]] // PT-4471/D4341, PT-4480/D2740
  const crossMatchEra = [{ ...mock835Records[3], patient_control_number: '' }] // PT-4480's
  const crossMatched = joinFeeds(crossMatchPms, crossMatchEra).claims
  const wrongPatient = crossMatched.find((r) => r.claim_id === 'CLM-88213')
  const rightPatient = crossMatched.find((r) => r.claim_id === 'CLM-88301')
  check(
    "a control-number-less remittance never lands on another patient's claim",
    wrongPatient?.match_status === 'unmatched' &&
      wrongPatient?.carc_code === null &&
      rightPatient?.match_status === 'fallback_matched' &&
      rightPatient?.carc_code === '16',
    `CLM-88213 → ${wrongPatient?.match_status}/${wrongPatient?.carc_code}, ` +
      `CLM-88301 → ${rightPatient?.match_status}/${rightPatient?.carc_code}`,
  )

  // ── Join: genuine ambiguity is refused, not guessed ───────────────────────
  // D4341 bills per quadrant, so one patient can hold two identical lines on one
  // date. The natural key cannot separate them and the join must not pretend it can.
  const ambiguousPms: PmsRecord[] = [
    { ...mockPmsRecords[1], patient_control_number: 'PMS-90001' },
    { ...mockPmsRecords[1], patient_control_number: 'PMS-90002' },
  ]
  const ambiguousJoin = joinFeeds(ambiguousPms, [
    { ...mock835Records[1], patient_control_number: '' },
  ])
  check(
    'two claims sharing a natural key are left unmatched rather than guessed between',
    ambiguousJoin.claims.every((r) => r.match_status === 'unmatched') &&
      ambiguousJoin.unmatchedRemittances.length === 1,
    `statuses ${ambiguousJoin.claims.map((r) => r.match_status).join(', ')}, ` +
      `${ambiguousJoin.unmatchedRemittances.length} remittance held back`,
  )

  // ── Join: a remittance is never handed out twice ──────────────────────────
  // One remittance, two PMS records: the first owns it by control number, the
  // second shares its natural key. Pass 2 must not re-issue what pass 1 took.
  const doubleClaimPms: PmsRecord[] = [
    mockPmsRecords[1], // PMS-88214 — matches on control number
    { ...mockPmsRecords[1], patient_control_number: 'PMS-90003' }, // same natural key
  ]
  const doubleClaimed = joinFeeds(doubleClaimPms, [mock835Records[1]]).claims
  check(
    'a remittance claimed on control number is not re-used by the fallback pass',
    doubleClaimed.filter((r) => r.match_status !== 'unmatched').length === 1 &&
      doubleClaimed[0].match_status === 'matched' &&
      doubleClaimed[1].match_status === 'unmatched',
    doubleClaimed.map((r) => `${r.claim_id}:${r.match_status}`).join(', '),
  )

  // ── Join: unmatched records survive on both sides ─────────────────────────
  const unmatchedJoined = joinFeeds([mockPmsRecords[0]], []).claims
  check(
    'a PMS record with no remittance is kept, not dropped',
    unmatchedJoined.length === 1 &&
      unmatchedJoined[0].match_status === 'unmatched' &&
      unmatchedJoined[0].match_key === null &&
      unmatchedJoined[0].carc_code === null,
    `length ${unmatchedJoined.length}, status ${unmatchedJoined[0]?.match_status}`,
  )

  // A remittance for a claim the practice has no record of. It cannot be rendered
  // as a claim, but it must not vanish either — it comes back on its own channel.
  const strandedJoin = joinFeeds(
    [mockPmsRecords[0]],
    [{ ...mock835Records[0], patient_control_number: '', patient_id: 'PT-0000' }],
  )
  check(
    'a remittance matching nothing is reported separately, not attached',
    strandedJoin.claims[0]?.match_status === 'unmatched' &&
      strandedJoin.claims[0]?.carc_code === null &&
      strandedJoin.unmatchedRemittances.length === 1,
    `claim ${strandedJoin.claims[0]?.match_status}, ` +
      `${strandedJoin.unmatchedRemittances.length} remittance reported`,
  )

  // ── Prioritization: the deadline override ─────────────────────────────────
  const ranked = prioritize(joined)
  const order = ranked.map((c) => c.record.claim_id)

  check(
    'ranking covers every classified claim',
    ranked.length === mockPmsRecords.length,
    `expected ${mockPmsRecords.length}, got ${ranked.length}`,
  )

  check(
    'exactly three claims share CARC 50 — the demo rests on it being three',
    joined.filter((r) => r.carc_code === '50').length === 3,
    `${joined.filter((r) => r.carc_code === '50').length} CARC 50 claims`,
  )

  check(
    'every claim resolves to a payer policy, so no deadline is silently absent',
    ranked.every((c) => c.appeal_deadline !== null),
    ranked
      .filter((c) => c.appeal_deadline === null)
      .map((c) => c.record.claim_id)
      .join(', ') || 'all covered',
  )

  check(
    'deadline-override claims sort ahead of everything else',
    ranked.filter((c) => c.deadline_override).every((c, i) => ranked[i] === c),
    ranked.map((c) => `${c.record.claim_id}:${c.deadline_override}`).join(', '),
  )

  const claimD = ranked.find((c) => c.record.claim_id === 'CLM-88301')
  const claimBRanked = ranked.find((c) => c.record.claim_id === 'CLM-88214')
  check(
    'the deadline beats the bigger claim: $310 with 11 days left outranks $1,150 with 103',
    ranked.indexOf(claimBRanked!) < ranked.indexOf(claimD!),
    `B at ${ranked.indexOf(claimBRanked!)} (${claimBRanked?.days_until_deadline}d), ` +
      `D at ${ranked.indexOf(claimD!)} (${claimD?.days_until_deadline}d)`,
  )

  check(
    "Claim B's appeal deadline lands 11 days out from the pinned demo date",
    claimBRanked?.days_until_deadline === 11,
    `DEMO_TODAY=${DEMO_TODAY}, deadline=${claimBRanked?.appeal_deadline}, ` +
      `days=${claimBRanked?.days_until_deadline}`,
  )

  const claimARanked = ranked.find((c) => c.record.claim_id === 'CLM-88213')
  check(
    'a write-off recommendation does not claim deadline urgency it will not act on',
    claimARanked?.deadline_override === false &&
      (claimARanked?.days_until_deadline ?? 0) <= DEADLINE_OVERRIDE_DAYS,
    `A is ${claimARanked?.days_until_deadline} days out but override=${claimARanked?.deadline_override}`,
  )

  check(
    'the low-confidence claim is not buried at the bottom of the queue',
    order.indexOf('CLM-88215') < ranked.length - 1,
    `queue order: ${ranked.map((c) => c.record.claim_id).join(' → ')}`,
  )

  check(
    'no claim surfaces a bare numeric score',
    ranked.every((c) => c.rationale.length > 0 && !/^\d+(\.\d+)?$/.test(c.rationale)),
    'every row explains itself in words',
  )

  // ── Outcomes: records agree with themselves ───────────────────────────────
  const inconsistent = mockOutcomes.filter((o) => !outcomeIsConsistent(o))
  check(
    'every outcome record is internally consistent',
    inconsistent.length === 0,
    inconsistent.map((o) => `${o.claim_id}:${o.result}/${o.outcome_source}`).join(', ') ||
      'pending ⇔ no source and no date; presumptions only from timeouts',
  )

  const outcomeIds = mockOutcomes.map((o) => o.claim_id)
  check(
    'outcome claim ids are well-formed and unique',
    new Set(outcomeIds).size === outcomeIds.length && outcomeIds.every((id) => /^CLM-\d+$/.test(id)),
    `${new Set(outcomeIds).size} distinct of ${outcomeIds.length}`,
  )

  // The denormalisation decision, made checkable: history describes claims that have
  // left the working set, so aggregation can never depend on joining back to one.
  const liveIds = new Set(joined.map((r) => r.claim_id))
  check(
    'history is disjoint from the live queue, so aggregation never joins back',
    outcomeIds.every((id) => !liveIds.has(id)),
    outcomeIds.filter((id) => liveIds.has(id)).join(', ') || 'no overlap',
  )

  const presumed = mockOutcomes.filter((o) => o.result === 'presumed_upheld')
  check(
    'every presumption waited out the full inference window',
    presumed.length > 0 && presumed.every(presumptionIsRipe),
    `${presumed.length} presumed, ${presumed.filter(presumptionIsRipe).length} ripe`,
  )

  // ── Outcomes: the state machine ───────────────────────────────────────────
  check(
    'a presumption stays correctable and a confirmation does not',
    canTransition('presumed_upheld', 'confirmed_overturned') &&
      canTransition('presumed_upheld', 'confirmed_upheld') &&
      !canTransition('confirmed_upheld', 'confirmed_overturned') &&
      !canTransition('presumed_upheld', 'pending'),
    'presumed → confirmed allowed; confirmed terminal; nothing returns to pending',
  )

  // ── Outcomes: aggregation ─────────────────────────────────────────────────
  const delta = byPayer(mockOutcomes, 'PAYER-DELTA-01')
  const deltaSummary = summarize(delta)
  check(
    'inferred outcomes are counted apart from observed ones',
    deltaSummary.inferred === delta.filter(isInferred).length && deltaSummary.inferred === 2,
    `${deltaSummary.inferred} of ${deltaSummary.resolved} Delta determinations inferred`,
  )

  // The reason a payer-level rate is not enough on its own: Delta wins most of what it
  // is asked, and loses almost everything on medical necessity.
  const deltaCarc50 = summarize(byCarc(delta, '50'))
  check(
    'the payer × denial-reason slice is weaker than the payer alone',
    deltaCarc50.overturn_rate !== null &&
      deltaSummary.overturn_rate !== null &&
      deltaCarc50.overturn_rate < deltaSummary.overturn_rate,
    `Delta overall ${deltaSummary.overturned}/${deltaSummary.resolved}, ` +
      `CARC 50 ${deltaCarc50.overturned}/${deltaCarc50.resolved}`,
  )

  const northstar = summarize(byPayer(mockOutcomes, 'PAYER-NORTHSTAR-04'))
  check(
    'a payer with filings but no determinations reports an unknown rate, not zero',
    northstar.total > 0 && northstar.resolved === 0 && northstar.overturn_rate === null,
    `${northstar.total} filed, ${northstar.pending} pending, rate ${northstar.overturn_rate}`,
  )

  const unknownPayer = summarize(byPayer(mockOutcomes, 'PAYER-DOES-NOT-EXIST'))
  check(
    'a payer with no history at all divides by nothing',
    unknownPayer.total === 0 &&
      unknownPayer.overturn_rate === null &&
      !Number.isNaN(unknownPayer.overturn_rate as unknown as number),
    `rate ${unknownPayer.overturn_rate}`,
  )

  // ── Report ────────────────────────────────────────────────────────────────
  const failed = results.filter((r) => !r.pass)
  const style = failed.length ? 'color:#C9822B;font-weight:600' : 'color:#02C39A;font-weight:600'
  console.groupCollapsed(
    `%cgumline self-check — ${results.length - failed.length}/${results.length} passed`,
    style,
  )
  for (const r of results) {
    console.log(`${r.pass ? '✓' : '✗'} ${r.name}${r.pass ? '' : ` — ${r.detail}`}`)
  }
  console.log(
    'queue order:',
    ranked.map((c) => `${c.record.claim_id} (${c.classification.action})`).join('  →  '),
  )
  console.groupEnd()
}
