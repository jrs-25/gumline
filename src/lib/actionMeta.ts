import type { ClaimAction } from '../types'

/**
 * Presentation rules per recommended action. Full class strings rather than composed
 * fragments so Tailwind's scanner can see every one of them.
 */
export interface ActionMeta {
  badgeLabel: string
  badgeClass: string
  linkLabel: string
  linkClass: string
  /**
   * Left-edge accent on the recommended-next-step panel. It tracks the action so the
   * page's closing note agrees with the badge at the top rather than contradicting it —
   * a teal accent on a write-off reads as a different verdict than the one being given.
   */
  accentClass: string
  /**
   * The queue row's own border, matching the badge it contains. Every row is coloured,
   * so the needs-review row reads as the strongest member of a consistent system rather
   * than as an anomaly — an emphasis that looks like a rendering fault isn't emphasis.
   */
  rowBorderClass: string
  /**
   * Position when the queue is sorted by status, ordered by how much human attention the
   * state demands rather than alphabetically. A biller sorting by status is asking "what
   * needs me?", so the claim the system declined to decide comes first and the one it is
   * confident to abandon comes last.
   */
  statusOrder: number
  /** Amber gets extra visual weight in the queue — see ClaimRow. */
  emphasise: boolean
}

export const ACTION_META: Record<ClaimAction, ActionMeta> = {
  approve_correction: {
    badgeLabel: 'Correction ready · awaiting approval',
    badgeClass: 'bg-mint-tint text-[#046b53] border-mint',
    linkLabel: 'Approve & resubmit',
    linkClass: 'text-[#046b53] hover:text-mint',
    accentClass: 'border-l-mint',
    rowBorderClass: 'border-mint',
    statusOrder: 2,
    emphasise: false,
  },
  proceed_to_drafting: {
    badgeLabel: 'Ready for review',
    badgeClass: 'bg-teal-tint text-teal border-teal',
    linkLabel: 'Review draft',
    linkClass: 'text-teal hover:text-seafoam',
    accentClass: 'border-l-teal',
    rowBorderClass: 'border-teal',
    statusOrder: 1,
    emphasise: false,
  },
  route_to_human_review: {
    badgeLabel: 'Needs human review',
    badgeClass: 'bg-amber-tint text-[#8f5a12] border-amber',
    linkLabel: 'Investigate',
    linkClass: 'text-[#8f5a12] hover:text-amber',
    accentClass: 'border-l-amber',
    rowBorderClass: 'border-amber',
    statusOrder: 0,
    emphasise: true,
  },
  recommend_writeoff_or_addendum: {
    badgeLabel: 'Recommend write-off',
    badgeClass: 'bg-[#f1f3f3] text-muted border-[#d5dbdc]',
    linkLabel: 'Review & write off',
    linkClass: 'text-muted hover:text-ink',
    // Matches the Confirm write-off button's own fill rather than the hairline colour —
    // a 4px hairline reads as a rendering fault at presentation distance, not an accent.
    accentClass: 'border-l-muted',
    rowBorderClass: 'border-[#d5dbdc]',
    statusOrder: 3,
    emphasise: false,
  },
}

/**
 * How each system of record is named in the UI. Shared by the correction diff and the
 * queue rationale so a claim can't be described as sourced from the provider roster in
 * one place and patient demographics in another.
 */
export const SOURCE_LABEL: Record<string, string> = {
  provider_roster: 'provider roster',
  payer_policy_table: 'payer policy table',
  patient_demographics: 'patient demographics',
}

export const CONFIDENCE_META: Record<'high' | 'low', { label: string; className: string }> = {
  high: { label: 'High confidence', className: 'text-teal' },
  low: { label: 'Low confidence', className: 'text-[#8f5a12]' },
}
