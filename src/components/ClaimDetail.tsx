import { useState } from 'react'
import type { RankedClaim, Resolution } from '../types'
import { CONFIDENCE_META } from '../lib/actionMeta'
import { getPayerPolicy } from '../data/payerPolicy'
import { formatCurrency, formatDate } from '../lib/dates'
import { ResolutionBadge, StatusBadge } from './StatusBadge'
import { AppealDraft } from './AppealDraft'
import { CorrectionDiff } from './CorrectionDiff'

interface ClaimDetailProps {
  claim: RankedClaim
  resolution?: Resolution
  /** The user's edited draft for this claim, if they have changed it this session. */
  draft?: string
  onDraftChange: (claimId: string, next: string) => void
  onBack: () => void
  onResolve: (claimId: string, resolution: Resolution) => void
}

function Section({
  title,
  children,
  className = '',
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-xl border border-hairline bg-white p-6 shadow-sm ${className}`}>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">{title}</h2>
      {children}
    </section>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-0.5 text-base text-ink">{value}</dd>
    </div>
  )
}

function ElementList({
  items,
  kind,
}: {
  items: string[]
  kind: 'matched' | 'missing'
}) {
  if (items.length === 0) {
    return (
      <p className="text-base text-muted">
        {kind === 'matched' ? 'None found in the record.' : 'None — the record is complete.'}
      </p>
    )
  }
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-base text-ink/90">
          <span
            className={`mt-0.5 shrink-0 text-lg font-bold ${
              kind === 'matched' ? 'text-mint' : 'text-[#c58787]'
            }`}
            aria-hidden
          >
            {kind === 'matched' ? '✓' : '✕'}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export function ClaimDetail({
  claim,
  resolution,
  draft,
  onDraftChange,
  onBack,
  onResolve,
}: ClaimDetailProps) {
  const [draftOpen, setDraftOpen] = useState(false)
  const [addendumRequested, setAddendumRequested] = useState(false)
  const [assignedToMe, setAssignedToMe] = useState(false)

  const { record, classification, appeal_deadline, days_until_deadline } = claim
  const confidence = CONFIDENCE_META[classification.confidence]
  const policy = getPayerPolicy(record.payer_id)

  // What the system wrote, versus what is on screen now. The edit lives in App so it
  // outlives this component's remount; reverting drops back to the generated text.
  const generatedDraft = classification.drafted_appeal ?? ''
  const draftText = draft ?? generatedDraft

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 text-base font-semibold text-teal transition hover:text-seafoam focus:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2"
      >
        ← Back to queue
      </button>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-3xl font-semibold tracking-tight text-ink">
              {record.claim_id}
            </h1>
            <span className="text-base text-muted">{classification.category}</span>
          </div>
          <p className="mt-2 text-lg text-muted">
            {record.patient_name} ({record.patient_id}) · {record.procedure_code}{' '}
            {record.procedure_desc}
          </p>
        </div>
        <div className="shrink-0">
          {resolution ? (
            <ResolutionBadge resolution={resolution} size="lg" />
          ) : (
            <StatusBadge action={classification.action} size="lg" />
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* The reasoning leads. This is the "no black box" principle made literal:
            the explanation comes before the verdict's supporting detail. */}
        <Section title="Why the system reached this conclusion">
          <p className="text-lg leading-relaxed text-ink">{classification.reasoning}</p>
          <div className="mt-5 flex flex-wrap gap-x-8 gap-y-3 border-t border-hairline pt-5">
            <Field
              label="Confidence"
              value={<span className={`font-semibold ${confidence.className}`}>{confidence.label}</span>}
            />
            {classification.documentation_match && (
              <Field
                label="Documentation match"
                value={<span className="capitalize">{classification.documentation_match}</span>}
              />
            )}
            {appeal_deadline && (
              <Field
                label={claim.deadline_label ?? 'Filing deadline'}
                value={
                  <>
                    {formatDate(appeal_deadline)}
                    {days_until_deadline !== null && (
                      <span
                        className={
                          claim.deadline_override ? 'font-semibold text-[#8f5a12]' : 'text-muted'
                        }
                      >
                        {' '}
                        ({days_until_deadline} days)
                      </span>
                    )}
                  </>
                }
              />
            )}
            <Field label="Billed" value={formatCurrency(record.billed_amount)} />
          </div>
        </Section>

        {/* Evidence */}
        <div className="grid gap-6 md:grid-cols-2">
          <Section title="Criteria met">
            <ElementList items={classification.matched_elements} kind="matched" />
          </Section>
          <Section title="Criteria missing">
            <ElementList items={classification.missing_elements} kind="missing" />
          </Section>
        </div>

        {/* The source text everything above was derived from. */}
        <Section title="Chart note (as written)">
          <blockquote className="border-l-4 border-hairline pl-4 text-lg leading-relaxed text-ink/90 italic">
            {record.chart_note}
          </blockquote>
          {record.imaging_refs && record.imaging_refs.length > 0 && (
            <p className="mt-4 text-sm text-muted">
              Imaging on file: {record.imaging_refs.join(', ')}
            </p>
          )}
        </Section>

        {/* The join, shown rather than assumed. */}
        <Section title="Joined record">
          <div className="mb-5 flex flex-wrap items-center gap-3 rounded-lg bg-shell px-4 py-3">
            <span className="text-sm text-muted">Matched on</span>
            <code className="font-mono text-sm font-semibold text-teal">
              {record.match_key ?? 'no match'}
            </code>
            {record.match_status === 'fallback_matched' && (
              <span className="rounded-md border border-amber bg-amber-tint px-2 py-0.5 text-xs font-semibold text-[#8f5a12]">
                Fallback — verify before acting
              </span>
            )}
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
                Practice management system
              </h3>
              <dl className="space-y-3">
                <Field
                  label="Patient control number"
                  value={<code className="font-mono">{record.patient_control_number}</code>}
                />
                <Field label="Date of service" value={formatDate(record.date_of_service)} />
                <Field label="Provider" value={record.provider} />
                <Field label="Billed amount" value={formatCurrency(record.billed_amount)} />
              </dl>
            </div>
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
                835 remittance advice
              </h3>
              <dl className="space-y-3">
                <Field
                  label="Payer claim control number"
                  value={<code className="font-mono">{record.payer_claim_control_number ?? '—'}</code>}
                />
                <Field
                  label="Denial code"
                  value={
                    record.carc_code
                      ? `CARC ${record.carc_code} — ${record.carc_description}`
                      : '—'
                  }
                />
                {record.rarc_code && (
                  <Field
                    label="Remark code"
                    value={`RARC ${record.rarc_code} — ${record.rarc_description}`}
                  />
                )}
                <Field label="Paid" value={formatCurrency(record.paid_amount)} />
                <Field label="Remittance date" value={formatDate(record.remittance_date)} />
              </dl>
            </div>
          </div>
          {policy && (
            <p className="mt-5 border-t border-hairline pt-4 text-sm text-muted">
              <span className="font-medium text-ink/70">{policy.payer_name}:</span>{' '}
              {policy.policy_note}
            </p>
          )}
        </Section>

        {/* What happens next — and nothing happens without a click. */}
        <Section title="Recommended next step" className="border-l-4 border-l-teal">
          <p className="text-lg leading-relaxed text-ink">
            {classification.recommended_next_step}
          </p>

          {resolution ? (
            <p className="mt-5 rounded-lg bg-shell px-4 py-3 text-base text-muted">
              {resolution === 'submitted'
                ? 'Submitted to the payer. Awaiting response — no further action needed here.'
                : 'Written off. Removed from the actionable queue.'}
            </p>
          ) : (
            <div className="mt-5">
              {classification.action === 'proceed_to_drafting' && (
                <>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setDraftOpen((open) => !open)}
                      className="rounded-lg border border-teal px-5 py-2.5 text-base font-semibold text-teal transition hover:bg-teal-tint focus:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2"
                    >
                      {draftOpen ? 'Hide drafted appeal' : 'View drafted appeal'}
                    </button>
                    <button
                      type="button"
                      disabled={!draftOpen}
                      onClick={() => onResolve(record.claim_id, 'submitted')}
                      className="rounded-lg bg-teal px-5 py-2.5 text-base font-semibold text-white transition hover:bg-seafoam disabled:cursor-not-allowed disabled:bg-[#c3cccd] focus:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2"
                    >
                      Submit appeal to payer
                    </button>
                  </div>
                  {!draftOpen && (
                    <p className="mt-3 text-sm text-muted">
                      Review the draft before submitting — you can edit it in place.
                      Nothing is sent until you do.
                    </p>
                  )}
                  {draftOpen && classification.drafted_appeal && (
                    <AppealDraft
                      draft={draftText}
                      onChange={(next) => onDraftChange(record.claim_id, next)}
                      edited={draftText !== generatedDraft}
                      onRevert={() => onDraftChange(record.claim_id, generatedDraft)}
                    />
                  )}
                </>
              )}

              {classification.action === 'approve_correction' && (
                <>
                  <CorrectionDiff classification={classification} />
                  <button
                    type="button"
                    onClick={() => onResolve(record.claim_id, 'submitted')}
                    className="mt-4 rounded-lg bg-mint px-5 py-2.5 text-base font-semibold text-[#022e33] transition hover:bg-seafoam hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2"
                  >
                    Approve & resubmit
                  </button>
                </>
              )}

              {classification.action === 'route_to_human_review' && (
                <div className="rounded-xl border border-amber bg-amber-tint/40 p-5">
                  <p className="text-base leading-relaxed text-ink">
                    <span className="font-semibold">No draft has been prepared.</span> The
                    documentation does not support a confident call in either direction, so nothing
                    has been written and nothing will be sent. A person needs to decide.
                  </p>
                  <ul className="mt-4 space-y-2 text-base text-ink/90">
                    <li className="flex gap-2.5">
                      <span className="text-[#8f5a12]">1.</span> Pull the radiographs from{' '}
                      {formatDate(record.date_of_service)} and check for bone loss.
                    </li>
                    <li className="flex gap-2.5">
                      <span className="text-[#8f5a12]">2.</span> Check the patient history for a
                      prior course of non-surgical therapy.
                    </li>
                    <li className="flex gap-2.5">
                      <span className="text-[#8f5a12]">3.</span> If both are present, send back for
                      drafting. If not, write off.
                    </li>
                  </ul>
                  <button
                    type="button"
                    onClick={() => setAssignedToMe(true)}
                    disabled={assignedToMe}
                    className="mt-5 rounded-lg bg-amber px-5 py-2.5 text-base font-semibold text-white transition hover:bg-[#a86a1f] disabled:cursor-default disabled:bg-[#d8b98c] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber focus-visible:ring-offset-2"
                  >
                    {assignedToMe ? 'Assigned to you' : 'Assign to me for review'}
                  </button>
                  {assignedToMe && (
                    <p className="mt-3 text-sm text-[#8f5a12]">
                      Stays in the queue until you resolve it — the system will not close it for
                      you.
                    </p>
                  )}
                </div>
              )}

              {classification.action === 'recommend_writeoff_or_addendum' && (
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => onResolve(record.claim_id, 'written_off')}
                    className="rounded-lg bg-muted px-5 py-2.5 text-base font-semibold text-white transition hover:bg-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-muted focus-visible:ring-offset-2"
                  >
                    Confirm write-off ({formatCurrency(record.billed_amount)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddendumRequested(true)}
                    disabled={addendumRequested}
                    className="rounded-lg border border-hairline px-5 py-2.5 text-base font-semibold text-ink transition hover:border-muted disabled:cursor-default disabled:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-muted focus-visible:ring-offset-2"
                  >
                    {addendumRequested
                      ? 'Addendum requested from Dr. Osei'
                      : 'Request provider addendum'}
                  </button>
                </div>
              )}
            </div>
          )}
        </Section>
      </div>
    </div>
  )
}
