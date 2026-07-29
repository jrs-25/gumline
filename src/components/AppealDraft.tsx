import { useEffect, useState } from 'react'

interface AppealDraftProps {
  draft: string
  onChange: (next: string) => void
  /** True once the text diverges from what the system generated. */
  edited: boolean
  onRevert: () => void
}

type SaveState = 'idle' | 'saving' | 'saved'

/**
 * The drafted appeal, editable in place. Generation is not what this demo is arguing
 * about. What it is arguing about is that a person reads the draft, can change any of
 * it, and only then decides — the draft is a starting point they own, not an output
 * they rubber-stamp. The header keeps the system's version and the human's edit
 * distinguishable, so "who wrote this" never becomes ambiguous.
 */
export function AppealDraft({ draft, onChange, edited, onRevert }: AppealDraftProps) {
  // Autosave status. Presentational: edits live in React state like everything else in
  // the prototype, so this reports the product's intended behaviour rather than a write
  // that actually happened. Keystrokes debounce into a single settle.
  const [saveState, setSaveState] = useState<SaveState>('idle')

  useEffect(() => {
    if (!edited) {
      setSaveState('idle')
      return
    }
    setSaveState('saving')
    const timer = setTimeout(() => setSaveState('saved'), 500)
    return () => clearTimeout(timer)
  }, [draft, edited])

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-hairline bg-white">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-hairline bg-shell px-5 py-3">
        <span className="text-sm font-semibold uppercase tracking-wide text-muted">
          Drafted appeal · not yet submitted
        </span>
        <span aria-live="polite" className="flex items-center gap-3 text-xs text-muted">
          <span>{edited ? 'Draft v1 · edited by you' : 'Draft v1'}</span>
          {saveState !== 'idle' && (
            <span className={saveState === 'saved' ? 'font-semibold text-[#046b53]' : ''}>
              {saveState === 'saved' ? '✓ Auto-saved' : 'Saving…'}
            </span>
          )}
          {edited && (
            <button
              type="button"
              onClick={onRevert}
              className="font-semibold text-teal underline-offset-2 transition hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2"
            >
              Revert
            </button>
          )}
        </span>
      </div>
      <textarea
        value={draft}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Drafted appeal narrative"
        spellCheck={false}
        className="block h-96 w-full resize-y bg-white px-6 py-5 font-sans text-base leading-relaxed text-ink/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal"
      />
    </div>
  )
}
