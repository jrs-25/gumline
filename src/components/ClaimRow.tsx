import type { RankedClaim, Resolution } from '../types'
import { ACTION_META } from '../lib/actionMeta'
import { formatCurrency } from '../lib/dates'
import { ResolutionBadge, StatusBadge } from './StatusBadge'

interface ClaimRowProps {
  claim: RankedClaim
  resolution?: Resolution
  onOpen: (claimId: string) => void
}

export function ClaimRow({ claim, resolution, onOpen }: ClaimRowProps) {
  const { record, classification, rationale, deadline_override } = claim
  const meta = ACTION_META[classification.action]

  // The low-confidence claim gets a heavier border and a tinted field. The whole point
  // of the demo is that "the system isn't sure" is a first-class outcome, so it must not
  // look like a lesser version of the confident rows.
  const emphasised = meta.emphasise && !resolution

  return (
    <button
      type="button"
      onClick={() => onOpen(record.claim_id)}
      className={`group block w-full rounded-xl border bg-white px-6 py-5 text-left shadow-sm transition hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 ${
        emphasised ? 'border-l-4 border-amber bg-amber-tint/30' : 'border-hairline'
      } ${resolution ? 'opacity-60' : ''}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="font-mono text-lg font-semibold text-ink">{record.claim_id}</span>
            <span className="text-sm text-muted">{classification.category}</span>
            {deadline_override && !resolution && (
              <span className="rounded-md bg-amber-tint px-2 py-0.5 text-xs font-semibold uppercase text-[#8f5a12]">
                Deadline
              </span>
            )}
            {record.match_status === 'fallback_matched' && (
              <span className="rounded-md border border-[#d5dbdc] px-2 py-0.5 text-xs font-medium text-muted">
                Fallback match
              </span>
            )}
          </div>

          <div className="mt-1.5 text-base text-muted">
            {record.patient_name} · {record.procedure_code} ·{' '}
            {formatCurrency(record.billed_amount)}
            {record.carc_code && <span> · CARC {record.carc_code}</span>}
          </div>

          <p className="mt-3 max-w-3xl text-base leading-relaxed text-ink/80">{rationale}</p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-3">
          {resolution ? (
            <ResolutionBadge resolution={resolution} />
          ) : (
            <StatusBadge action={classification.action} />
          )}
          {!resolution && (
            <span className={`text-base font-semibold ${meta.linkClass}`}>
              {meta.linkLabel}{' '}
              <span className="inline-block transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
