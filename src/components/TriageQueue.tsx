import type { RankedClaim, ResolutionMap } from '../types'
import { DEMO_TODAY, formatCurrency, formatDate } from '../lib/dates'
import { ClaimRow } from './ClaimRow'

interface TriageQueueProps {
  claims: RankedClaim[]
  resolutions: ResolutionMap
  onOpen: (claimId: string) => void
}

export function TriageQueue({ claims, resolutions, onOpen }: TriageQueueProps) {
  const actionable = claims.filter((c) => !resolutions[c.record.claim_id])
  const resolved = claims.filter((c) => resolutions[c.record.claim_id])

  const openValue = actionable.reduce((sum, c) => sum + c.record.billed_amount, 0)
  const needsReview = actionable.filter(
    (c) => c.classification.action === 'route_to_human_review',
  ).length

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Denial triage queue</h1>
        <p className="mt-2 text-lg text-muted">
          {actionable.length} open {actionable.length === 1 ? 'denial' : 'denials'} ·{' '}
          {formatCurrency(openValue)} outstanding
          {needsReview > 0 && <> · {needsReview} awaiting human judgment</>}
        </p>
        <p className="mt-1 text-sm text-muted">
          Ranked by appeal deadline, then by recoverable value. As of {formatDate(DEMO_TODAY)}.
        </p>
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
