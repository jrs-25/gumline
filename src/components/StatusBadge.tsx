import type { ClaimAction, Resolution } from '../types'
import { ACTION_META } from '../lib/actionMeta'

const SIZE = {
  sm: 'px-3 py-1 text-xs',
  lg: 'px-4 py-1.5 text-sm',
}

export function StatusBadge({ action, size = 'sm' }: { action: ClaimAction; size?: 'sm' | 'lg' }) {
  const meta = ACTION_META[action]
  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold tracking-wide uppercase ${meta.badgeClass} ${SIZE[size]}`}
    >
      {meta.badgeLabel}
    </span>
  )
}

const RESOLUTION_LABEL: Record<Resolution, string> = {
  submitted: 'Submitted · awaiting payer response',
  written_off: 'Written off',
}

export function ResolutionBadge({
  resolution,
  size = 'sm',
}: {
  resolution: Resolution
  size?: 'sm' | 'lg'
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-[#d5dbdc] bg-[#f1f3f3] font-semibold tracking-wide text-muted uppercase ${SIZE[size]}`}
    >
      {RESOLUTION_LABEL[resolution]}
    </span>
  )
}
