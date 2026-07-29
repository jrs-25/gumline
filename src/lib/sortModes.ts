import type { ClaimCategory, RankedClaim } from '../types'
import { ACTION_META } from './actionMeta'
import { recoverableValue } from './prioritize'

/**
 * Manual sort overrides for the triage queue.
 *
 * `recommended` is the system's own ranking — deadline override first, then recoverable
 * value — and it is the initial state. It is a named option rather than an unlabelled
 * default on purpose: the product's argument is that the system has a considered opinion
 * about what to work next, so leaving that opinion should be a visible, reversible act
 * rather than something a user does without noticing.
 *
 * Display only. None of this touches how claims are ranked or what their rationale says.
 */
export type SortMode =
  | 'recommended'
  | 'deadline'
  | 'value'
  | 'confidence'
  | 'category'
  | 'status'

export const DEFAULT_SORT: SortMode = 'recommended'

export const SORT_OPTIONS: ReadonlyArray<{ value: SortMode; label: string }> = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'deadline', label: 'Appeal deadline' },
  { value: 'value', label: 'Recoverable value' },
  { value: 'confidence', label: 'Confidence' },
  { value: 'category', label: 'Category' },
  { value: 'status', label: 'Status' },
]

/** How the queue describes itself under each sort, below the headline counts. */
export const SORT_DESCRIPTION: Record<SortMode, string> = {
  recommended: 'Ranked by appeal deadline, then by recoverable value',
  deadline: 'Sorted by appeal deadline, soonest first',
  value: 'Sorted by recoverable value, highest first',
  confidence: 'Sorted by confidence, least certain first',
  category: 'Sorted by denial category',
  status: 'Sorted by status, most human attention first',
}

/** Domain order, matching the ClaimCategory union rather than the alphabet. */
const CATEGORY_ORDER: Record<ClaimCategory, number> = {
  Administrative: 0,
  Documentation: 1,
  Clinical: 2,
}

/**
 * Least certain first. Sorting by confidence is how a biller asks "where is the system
 * unsure?" — surfacing the confident claims first would answer the opposite question.
 */
const CONFIDENCE_ORDER = { low: 0, high: 1 }

type Comparator = (a: RankedClaim, b: RankedClaim) => number

const COMPARATORS: Record<Exclude<SortMode, 'recommended'>, Comparator> = {
  // Claims with no payer policy have no deadline; they sort last rather than as zero.
  deadline: (a, b) => {
    const left = a.days_until_deadline ?? Number.POSITIVE_INFINITY
    const right = b.days_until_deadline ?? Number.POSITIVE_INFINITY
    return left - right
  },
  value: (a, b) => recoverableValue(b) - recoverableValue(a),
  confidence: (a, b) =>
    CONFIDENCE_ORDER[a.classification.confidence] -
    CONFIDENCE_ORDER[b.classification.confidence],
  category: (a, b) =>
    CATEGORY_ORDER[a.classification.category] - CATEGORY_ORDER[b.classification.category],
  status: (a, b) =>
    ACTION_META[a.classification.action].statusOrder -
    ACTION_META[b.classification.action].statusOrder,
}

/**
 * Apply a sort override. `claims` is expected to arrive in recommended order, which is
 * also the tiebreak: within equal keys the system's own judgement still decides, so a
 * manual sort refines the recommended order rather than scrambling it.
 */
export function sortClaims(claims: RankedClaim[], mode: SortMode): RankedClaim[] {
  if (mode === 'recommended') return claims

  const recommendedRank = new Map(claims.map((claim, i) => [claim.record.claim_id, i]))
  const compare = COMPARATORS[mode]

  return [...claims].sort(
    (a, b) =>
      compare(a, b) ||
      recommendedRank.get(a.record.claim_id)! - recommendedRank.get(b.record.claim_id)!,
  )
}
