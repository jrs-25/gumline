import type { RankedClaim, ResolutionMap } from '../types'
import { DEMO_TODAY, formatCurrency, formatDate } from '../lib/dates'
import {
  DEFAULT_SORT,
  SORT_DESCRIPTION,
  SORT_OPTIONS,
  sortClaims,
  type SortMode,
} from '../lib/sortModes'
import { ClaimRow } from './ClaimRow'

interface TriageQueueProps {
  claims: RankedClaim[]
  resolutions: ResolutionMap
  sortMode: SortMode
  onSortChange: (mode: SortMode) => void
  onOpen: (claimId: string) => void
}

export function TriageQueue({
  claims,
  resolutions,
  sortMode,
  onSortChange,
  onOpen,
}: TriageQueueProps) {
  // Sort the whole set once, then split — so the actioned section follows the same
  // ordering the user chose rather than silently keeping the recommended one.
  const sorted = sortClaims(claims, sortMode)
  const actionable = sorted.filter((c) => !resolutions[c.record.claim_id])
  const resolved = sorted.filter((c) => resolutions[c.record.claim_id])

  const openValue = actionable.reduce((sum, c) => sum + c.record.billed_amount, 0)
  const needsReview = actionable.filter(
    (c) => c.classification.action === 'route_to_human_review',
  ).length
  const overridden = sortMode !== DEFAULT_SORT

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-semibold tracking-tight text-ink">Denial triage queue</h1>
          <p className="mt-2 text-lg text-muted">
            {actionable.length} open {actionable.length === 1 ? 'denial' : 'denials'} ·{' '}
            {formatCurrency(openValue)} outstanding
            {needsReview > 0 && <> · {needsReview} awaiting human judgment</>}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted">
            <span>
              {SORT_DESCRIPTION[sortMode]}. As of {formatDate(DEMO_TODAY)}.
            </span>
            {/* Leaving the system's ranking should be visible and one click to undo. */}
            {overridden && (
              <button
                type="button"
                onClick={() => onSortChange(DEFAULT_SORT)}
                className="font-semibold text-teal underline-offset-2 transition hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2"
              >
                Back to recommended
              </button>
            )}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <label htmlFor="sort-mode" className="text-sm font-medium text-muted">
            Sort by
          </label>
          <select
            id="sort-mode"
            value={sortMode}
            onChange={(event) => onSortChange(event.target.value as SortMode)}
            className="rounded-lg border border-hairline bg-white px-3 py-2 text-base font-medium text-ink shadow-sm transition hover:border-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      {actionable.length > 0 ? (
        <div className="space-y-4">
          {actionable.map((claim) => (
            <ClaimRow key={claim.record.claim_id} claim={claim} onOpen={onOpen} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-hairline bg-white px-6 py-12 text-center">
          <p className="text-lg text-muted">Queue clear — every denial has been actioned.</p>
        </div>
      )}

      {resolved.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
            Actioned this session
          </h2>
          <div className="space-y-4">
            {resolved.map((claim) => (
              <ClaimRow
                key={claim.record.claim_id}
                claim={claim}
                resolution={resolutions[claim.record.claim_id]}
                onOpen={onOpen}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
