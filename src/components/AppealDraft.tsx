/**
 * The drafted appeal narrative. Static text in the prototype — generation is not what
 * this demo is arguing about. What it is arguing about is that the draft is shown to a
 * person before anything leaves the building.
 */
export function AppealDraft({ draft }: { draft: string }) {
  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-hairline bg-white">
      <div className="flex items-center justify-between border-b border-hairline bg-shell px-5 py-3">
        <span className="text-sm font-semibold uppercase tracking-wide text-muted">
          Drafted appeal · not yet submitted
        </span>
        <span className="text-xs text-muted">Draft v1</span>
      </div>
      <div className="max-h-96 overflow-y-auto px-6 py-5">
        <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed text-ink/90">
          {draft}
        </pre>
      </div>
    </div>
  )
}
