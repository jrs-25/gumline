import type { ClaimOutcomeRecord, DocumentationMatch } from '../types'
import { byCarc, byDocumentationMatch, byPayer, isInferred, isResolved } from './outcomes'

/**
 * Payer track record — how likely an appeal is to be overturned, given who the payer is,
 * what they denied it for, and how strong the documentation was.
 *
 * The whole problem this solves is that the interesting slices are tiny. Filtering the
 * outcomes log by payer, then denial reason, then documentation strength multiplies the
 * number of buckets while dividing the same records among them, so the most specific
 * question — "how does Delta treat weakly-documented medical-necessity denials?" — is
 * exactly the one with two records behind it. The raw rate over two records is a real
 * number and it is not evidence: Delta's CARC 252 history reads 2 of 2, which arithmetic
 * renders as 100% and honesty renders as "we have barely looked".
 *
 * So an estimate is never taken from its own slice alone. It starts from what the coarser
 * slice above it believes and moves toward its own data in proportion to how much data
 * it has. A slice with real volume ends up saying what its records say; a slice with two
 * records ends up saying roughly what its parent says, which is the truthful answer.
 */

/**
 * How much the inherited estimate is worth, measured in observations.
 *
 * At n = PRIOR_STRENGTH a slice's estimate sits halfway between what it inherited and
 * what its own records say. Five is a judgement call, not a derived quantity — it says
 * "five determinations is where this slice starts to outweigh what we already believed".
 */
export const PRIOR_STRENGTH = 5

/**
 * What a determination inferred from silence is worth against one that was observed.
 *
 * A `presumed_upheld` is a real signal — the payer has not paid in sixty days — but it is
 * not a determination, and late reprocessing does happen. Counting it as a full loss
 * would let the passage of time manufacture evidence.
 */
export const INFERRED_WEIGHT = 0.5

/**
 * Where the chain starts when there is no history at all: a coin, held weakly. The
 * strength is deliberately low, so the first handful of real determinations displaces it
 * rather than fighting it.
 */
const ROOT_RATE = 0.5
const ROOT_STRENGTH = 2

/** The finest level that contributed any observations of its own. */
export type TrackRecordBasis =
  | 'prior'
  | 'global'
  | 'payer'
  | 'payer+reason'
  | 'payer+reason+documentation'

export interface TrackRecordQuery {
  payer_id: string
  carc_code?: string
  /** `null` is a real value — administrative claims have no documentation dimension. */
  documentation_match?: DocumentationMatch
}

export interface PayerTrackRecord {
  /** Raw counts from the finest requested slice. For display — never the estimate. */
  resolved: number
  overturned: number
  /** How many of those determinations came from a timeout rather than an observation. */
  inferred: number
  /** The unsmoothed rate, or null when nothing has resolved. What not to show a user. */
  raw_rate: number | null

  /** The shrunk estimate. Always defined: with no history it is what the parent believed. */
  estimate: number
  /**
   * How much of the estimate rests on this slice's own records, 0 to 1. Zero means the
   * number is entirely inherited and this payer has told us nothing yet — the case a bare
   * rate would silently misrepresent as knowledge.
   */
  evidence_weight: number
  basis: TrackRecordBasis
}

/** Weighted counts — inferred determinations carry less than observed ones. */
function weigh(records: ClaimOutcomeRecord[]): { n: number; wins: number } {
  let n = 0
  let wins = 0
  for (const record of records) {
    if (!isResolved(record)) continue
    const weight = isInferred(record) ? INFERRED_WEIGHT : 1
    n += weight
    if (record.result === 'confirmed_overturned') wins += weight
  }
  return { n, wins }
}

/**
 * Build the chain of slices from coarsest to finest.
 *
 * Strictly nested — every level is a subset of the one before it. A `ClaimCategory` level
 * was considered and left out: CARC already identifies the denial reason more precisely,
 * and category pools across payers, so inserting it between global and payer would build
 * Delta's prior partly from other payers' claims. That is the right move only if payer
 * identity carries no information, and the entire premise here is that it does.
 */
function buildChain(
  records: ClaimOutcomeRecord[],
  query: TrackRecordQuery,
): Array<{ basis: TrackRecordBasis; records: ClaimOutcomeRecord[] }> {
  const chain: Array<{ basis: TrackRecordBasis; records: ClaimOutcomeRecord[] }> = [
    { basis: 'global', records },
  ]

  const payer = byPayer(records, query.payer_id)
  chain.push({ basis: 'payer', records: payer })

  if (query.carc_code === undefined) return chain
  const reason = byCarc(payer, query.carc_code)
  chain.push({ basis: 'payer+reason', records: reason })

  if (query.documentation_match === undefined) return chain
  chain.push({
    basis: 'payer+reason+documentation',
    records: byDocumentationMatch(reason, query.documentation_match),
  })

  return chain
}

/**
 * Fold the chain from coarse to fine, each level shrinking toward what the level above
 * it concluded. The last level's own weight is what `evidence_weight` reports, because
 * that is the slice the caller actually asked about.
 */
export function payerTrackRecord(
  records: ClaimOutcomeRecord[],
  query: TrackRecordQuery,
): PayerTrackRecord {
  const chain = buildChain(records, query)

  let estimate = ROOT_RATE
  let priorStrength = ROOT_STRENGTH
  let basis: TrackRecordBasis = 'prior'
  let finestWeight = 0

  for (const level of chain) {
    const { n, wins } = weigh(level.records)
    estimate = (wins + priorStrength * estimate) / (n + priorStrength)
    if (n > 0) basis = level.basis
    finestWeight = n
    priorStrength = PRIOR_STRENGTH
  }

  const finest = chain[chain.length - 1].records
  const resolved = finest.filter(isResolved)
  const overturned = resolved.filter((r) => r.result === 'confirmed_overturned').length

  return {
    resolved: resolved.length,
    overturned,
    inferred: resolved.filter(isInferred).length,
    raw_rate: resolved.length === 0 ? null : overturned / resolved.length,
    estimate,
    evidence_weight: finestWeight / (finestWeight + PRIOR_STRENGTH),
    basis,
  }
}
