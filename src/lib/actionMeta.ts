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
  /** Amber gets extra visual weight in the queue — see ClaimRow. */
  emphasise: boolean
}

export const ACTION_META: Record<ClaimAction, ActionMeta> = {
  approve_correction: {
    badgeLabel: 'Correction ready · awaiting approval',
    badgeClass: 'bg-mint-tint text-[#046b53] border-mint',
    linkLabel: 'Approve & resubmit',
    linkClass: 'text-[#046b53] hover:text-mint',
    emphasise: false,
  },
  proceed_to_drafting: {
    badgeLabel: 'Ready for review',
    badgeClass: 'bg-teal-tint text-teal border-teal',
    linkLabel: 'Review draft',
    linkClass: 'text-teal hover:text-seafoam',
    emphasise: false,
  },
  route_to_human_review: {
    badgeLabel: 'Needs human review',
    badgeClass: 'bg-amber-tint text-[#8f5a12] border-amber',
    linkLabel: 'Investigate',
    linkClass: 'text-[#8f5a12] hover:text-amber',
    emphasise: true,
  },
  recommend_writeoff_or_addendum: {
    badgeLabel: 'Recommend write-off',
    badgeClass: 'bg-[#f1f3f3] text-muted border-[#d5dbdc]',
    linkLabel: 'Review & write off',
    linkClass: 'text-muted hover:text-ink',
    emphasise: false,
  },
}

export const CONFIDENCE_META: Record<'high' | 'low', { label: string; className: string }> = {
  high: { label: 'High confidence', className: 'text-teal' },
  low: { label: 'Low confidence', className: 'text-[#8f5a12]' },
}
