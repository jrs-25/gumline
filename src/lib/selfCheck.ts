import type { Era835Record, PmsRecord } from '../types'
import { mockPmsRecords } from '../data/mockPmsRecords'
import { mock835Records } from '../data/mock835Records'
import { joinFeeds } from './joinFeeds'
import { prioritize } from './prioritize'
import { DEADLINE_OVERRIDE_DAYS, DEMO_TODAY } from './dates'

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
  const joined = joinFeeds(mockPmsRecords, mock835Records)

  check(
    'join returns one row per PMS record',
    joined.length === mockPmsRecords.length,
    `expected ${mockPmsRecords.length}, got ${joined.length}`,
  )

  check(
    'all four seed claims match on patient_control_number',
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
  const fallbackJoined = joinFeeds(pmsOrphan, eraNoControlNumber)
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

  // ── Join: unmatched records survive ───────────────────────────────────────
  const unmatchedJoined = joinFeeds([mockPmsRecords[0]], [])
  check(
    'a PMS record with no remittance is kept, not dropped',
    unmatchedJoined.length === 1 &&
      unmatchedJoined[0].match_status === 'unmatched' &&
      unmatchedJoined[0].match_key === null &&
      unmatchedJoined[0].carc_code === null,
    `length ${unmatchedJoined.length}, status ${unmatchedJoined[0]?.match_status}`,
  )

  // ── Prioritization: the deadline override ─────────────────────────────────
  const ranked = prioritize(joined)
  const order = ranked.map((c) => c.record.claim_id)

  check(
    'ranking covers every classified claim',
    ranked.length === 4,
    `got ${ranked.length}`,
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
