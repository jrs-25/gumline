import type {
  ClaimCategory,
  ClaimOutcomeRecord,
  OutcomeResult,
} from '../types'
import { daysBetween } from './dates'

/**
 * How long a filing sits unanswered before it is presumed upheld.
 *
 * The number is a judgement call, not a payer rule. What matters is that the inference
 * it produces stays labelled as one: a slow payer and a lost appeal look identical from
 * the remittance feed, and the log must not pretend otherwise.
 */
export const PRESUMED_UPHELD_AFTER_DAYS = 60

/**
 * Which result states can follow which.
 *
 * `presumed_upheld` is not terminal. Payers reprocess months late, and a biller can get
 * a determination by phone at any point, so a presumption has to remain correctable —
 * otherwise the timeout would quietly harden a guess into a fact.
 */
const LEGAL_TRANSITIONS: Record<OutcomeResult, OutcomeResult[]> = {
  pending: ['presumed_upheld', 'confirmed_overturned', 'confirmed_upheld'],
  presumed_upheld: ['confirmed_overturned', 'confirmed_upheld'],
  confirmed_overturned: [],
  confirmed_upheld: [],
}

export function canTransition(from: OutcomeResult, to: OutcomeResult): boolean {
  return LEGAL_TRANSITIONS[from].includes(to)
}

/** Anything but `pending` — a determination exists, however it was arrived at. */
export function isResolved(record: ClaimOutcomeRecord): boolean {
  return record.result !== 'pending'
}

/**
 * Derived rather than stored. A boolean field alongside the source could disagree with
 * it; a function cannot.
 */
export function isInferred(record: ClaimOutcomeRecord): boolean {
  return record.outcome_source === 'timeout_inference'
}

/**
 * Whether a record's own fields agree with each other. Three invariants, each of which
 * would otherwise be enforced only by whoever typed the fixture:
 *
 *   - pending means no source and no outcome date, and nothing else does
 *   - a presumption can only have come from a timeout
 *   - a timeout can only ever produce a presumption, never a confirmation
 */
export function outcomeIsConsistent(record: ClaimOutcomeRecord): boolean {
  const pending = record.result === 'pending'
  if (pending !== (record.outcome_source === null)) return false
  if (pending !== (record.outcome_date === null)) return false

  if (record.result === 'presumed_upheld' && record.outcome_source !== 'timeout_inference') {
    return false
  }
  if (record.result.startsWith('confirmed_') && record.outcome_source === 'timeout_inference') {
    return false
  }
  return true
}

/** A presumption is only honest if the clock it claims to be based on actually ran. */
export function presumptionIsRipe(record: ClaimOutcomeRecord): boolean {
  if (record.result !== 'presumed_upheld' || !record.outcome_date) return false
  return daysBetween(record.action_date, record.outcome_date) >= PRESUMED_UPHELD_AFTER_DAYS
}

export interface OutcomeSummary {
  total: number
  pending: number
  resolved: number
  overturned: number
  upheld: number
  /** How many of the resolved outcomes were inferred from silence rather than observed. */
  inferred: number
  /**
   * Overturns as a share of determinations, or null when there are none yet.
   *
   * Null rather than 0: a payer nobody has heard back from has an unknown rate, and
   * reporting that as zero would read as "this payer never overturns" — the most
   * damaging possible misreading of an empty sample.
   */
  overturn_rate: number | null
}

export function summarize(records: ClaimOutcomeRecord[]): OutcomeSummary {
  const resolved = records.filter(isResolved)
  const overturned = resolved.filter((r) => r.result === 'confirmed_overturned').length

  return {
    total: records.length,
    pending: records.length - resolved.length,
    resolved: resolved.length,
    overturned,
    upheld: resolved.length - overturned,
    inferred: resolved.filter(isInferred).length,
    overturn_rate: resolved.length === 0 ? null : overturned / resolved.length,
  }
}

export function byPayer(
  records: ClaimOutcomeRecord[],
  payerId: string,
): ClaimOutcomeRecord[] {
  return records.filter((r) => r.payer_id === payerId)
}

export function byCategory(
  records: ClaimOutcomeRecord[],
  category: ClaimCategory,
): ClaimOutcomeRecord[] {
  return records.filter((r) => r.category === category)
}

export function byCarc(records: ClaimOutcomeRecord[], carcCode: string): ClaimOutcomeRecord[] {
  return records.filter((r) => r.carc_code === carcCode)
}
