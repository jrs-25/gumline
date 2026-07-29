import type {
  ClaimAction,
  ClassificationResult,
  DocumentationMatch,
  MatchedDenialRecord,
  RankedClaim,
} from '../types'
import { getClassification } from '../data/mockClassifications'
import { DEADLINE_LABEL, getPayerPolicy } from '../data/payerPolicy'
import { SOURCE_LABEL } from './actionMeta'
import { addDays, daysFromDemoToday, DEADLINE_OVERRIDE_DAYS, formatCurrency } from './dates'

/**
 * Deadline pressure only counts while a payer-facing filing is still on the table.
 * A claim we're recommending for write-off isn't racing anything — surfacing it as
 * urgent would be noise dressed up as rigour.
 */
const APPEAL_LIVE_ACTIONS: ClaimAction[] = ['proceed_to_drafting', 'route_to_human_review']

/**
 * How much of the billed amount is realistically recoverable, by documentation strength.
 * Deliberately coarse — this is a sort key, not a prediction, and pretending to more
 * precision than four buckets would be false confidence.
 */
const DOC_STRENGTH_WEIGHT: Record<string, number> = {
  strong: 1.0,
  ambiguous: 0.6,
  available_not_submitted: 0.5,
  weak: 0.2,
  // Administrative corrections have no documentation dimension, but a known correct
  // value from a system of record is close to a certain recovery.
  administrative: 0.9,
}

function docWeight(match: DocumentationMatch): number {
  return DOC_STRENGTH_WEIGHT[match ?? 'administrative'] ?? 0.5
}

/**
 * Billed amount discounted by documentation strength — what this queue means by
 * "recoverable value". Exported so the manual sort control uses the same definition the
 * ranking does; two notions of "value" in one screen would be a quiet lie.
 */
export function recoverableValue(claim: RankedClaim): number {
  return claim.record.billed_amount * docWeight(claim.classification.documentation_match)
}

function docPhrase(match: DocumentationMatch): string {
  switch (match) {
    case 'strong':
      return 'Strong documentation match'
    case 'ambiguous':
      return 'Ambiguous documentation'
    case 'weak':
      return 'Weak documentation match'
    case 'available_not_submitted':
      return 'Documentation available but not submitted'
    default:
      return 'Administrative correction'
  }
}

function actionPhrase(classification: ClassificationResult): string {
  switch (classification.action) {
    case 'proceed_to_drafting':
      return 'draft prepared'
    case 'route_to_human_review':
      return 'needs human judgment before drafting'
    case 'recommend_writeoff_or_addendum':
      return 'no appealable evidence in chart'
    case 'approve_correction': {
      // Name the actual system of record. Two correction claims can draw on different
      // ones, and asserting the wrong source is the kind of small lie that costs trust.
      const source = classification.source_of_truth
      const label = source ? (SOURCE_LABEL[source] ?? source) : 'a system of record'
      return `corrected value ready from ${label}`
    }
  }
}

function deadlinePhrase(days: number | null, label: string | null): string | null {
  if (days === null) return null
  // Beyond a month out the countdown isn't informative; it just crowds the line.
  if (days > 30) return null
  const noun = (label ?? 'Filing deadline').toLowerCase()
  if (days < 0) return `${noun.replace('deadline', 'window')} closed ${Math.abs(days)} days ago`
  if (days === 0) return `${noun} today`
  if (days === 1) return `${noun} tomorrow`
  return `${noun} in ${days} days`
}

/**
 * Rank the queue. Deterministic and fully inspectable — no model involved.
 *
 * Two rules, in order:
 *   1. A closing appeal deadline is a hard override. Anything inside the window floats
 *      to the top regardless of how much money is on it.
 *   2. Everything else sorts on billed amount discounted by documentation strength.
 *
 * Each claim carries a rationale string explaining its own position. The product
 * principle is that a biller can see why a claim is where it is; a single opaque
 * priority number would technically sort the list and tell them nothing.
 */
export function prioritize(records: MatchedDenialRecord[]): RankedClaim[] {
  const claims: RankedClaim[] = records.flatMap((record) => {
    const classification = getClassification(record.claim_id)
    if (!classification) return []

    const policy = getPayerPolicy(record.payer_id)
    const appealDeadline =
      policy && record.remittance_date
        ? addDays(record.remittance_date, policy.appeal_window_days)
        : null
    const daysUntilDeadline = appealDeadline ? daysFromDemoToday(appealDeadline) : null

    const appealLive = APPEAL_LIVE_ACTIONS.includes(classification.action)
    const deadlineOverride =
      daysUntilDeadline !== null &&
      daysUntilDeadline <= DEADLINE_OVERRIDE_DAYS &&
      appealLive

    // The middle clause answers "what's at stake here" — a countdown when the claim is
    // actually racing a window, money otherwise. Showing a deadline on a claim we're
    // not appealing would read as urgency the ranking doesn't actually act on.
    const deadlineLabel = policy ? DEADLINE_LABEL[policy.deadline_type] : null
    const stakesClause = appealLive
      ? deadlinePhrase(daysUntilDeadline, deadlineLabel)
      : classification.action === 'recommend_writeoff_or_addendum'
        ? `${formatCurrency(record.billed_amount)} at risk`
        : `${formatCurrency(record.billed_amount)} recoverable`

    const clauses = [
      docPhrase(classification.documentation_match),
      stakesClause,
      actionPhrase(classification),
    ].filter((clause): clause is string => Boolean(clause))

    return [
      {
        record,
        classification,
        appeal_deadline: appealDeadline,
        days_until_deadline: daysUntilDeadline,
        deadline_label: deadlineLabel,
        deadline_override: deadlineOverride,
        rationale: clauses.join(' · '),
      },
    ]
  })

  return claims.sort((a, b) => {
    if (a.deadline_override !== b.deadline_override) {
      return a.deadline_override ? -1 : 1
    }
    // Inside the override group the nearest deadline still doesn't win — the point of
    // the override is that they're all urgent, so value and strength break the tie.
    return recoverableValue(b) - recoverableValue(a)
  })
}
