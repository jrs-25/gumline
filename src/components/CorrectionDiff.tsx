import type { ClassificationResult } from '../types'

const SOURCE_LABEL: Record<string, string> = {
  provider_roster: 'provider roster',
  payer_policy_table: 'payer policy table',
}

/**
 * The exact field-level change the system proposes, shown before it is applied.
 * A correction the biller can't see is a correction they can't be accountable for.
 */
export function CorrectionDiff({ classification }: { classification: ClassificationResult }) {
  const { corrected_field, corrected_value, source_of_truth } = classification
  if (!corrected_field || !corrected_value) return null

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-hairline bg-white">
      <div className="border-b border-hairline bg-shell px-5 py-3">
        <span className="text-sm font-semibold uppercase tracking-wide text-muted">
          Proposed correction
        </span>
      </div>
      <div className="px-6 py-5">
        <div className="text-sm font-medium text-muted">{corrected_field}</div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="rounded-lg border border-[#e6c9c9] bg-[#fbf0f0] px-4 py-2 font-mono text-base text-[#9a4a4a] line-through decoration-[#c58787]">
            [blank]
          </span>
          <span className="text-xl text-muted">→</span>
          <span className="rounded-lg border border-mint bg-mint-tint px-4 py-2 font-mono text-base font-semibold text-[#046b53]">
            {corrected_value}
          </span>
        </div>
        {source_of_truth && (
          <p className="mt-4 text-sm text-muted">
            Sourced from {SOURCE_LABEL[source_of_truth] ?? source_of_truth}. Nothing is written
            back until you approve.
          </p>
        )}
      </div>
    </div>
  )
}
