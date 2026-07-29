import { useMemo, useState } from 'react'
import type { DraftMap, Resolution, ResolutionMap } from './types'
import { mockPmsRecords } from './data/mockPmsRecords'
import { mock835Records } from './data/mock835Records'
import { joinFeeds } from './lib/joinFeeds'
import { prioritize } from './lib/prioritize'
import { AppHeader } from './components/AppHeader'
import { TriageQueue } from './components/TriageQueue'
import { ClaimDetail } from './components/ClaimDetail'

export default function App() {
  // The feeds are static, so the join and the ranking run once. Resolutions are the only
  // thing that changes, and they live in React state — nothing is persisted anywhere.
  const claims = useMemo(
    () => prioritize(joinFeeds(mockPmsRecords, mock835Records).claims),
    [],
  )

  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null)
  const [resolutions, setResolutions] = useState<ResolutionMap>({})
  // Draft edits live here rather than in ClaimDetail, which is keyed on claim id and so
  // remounts on every open. Transient screen state (is the draft panel open, has an
  // addendum been requested) should reset on reopen; the user's written words should not.
  const [drafts, setDrafts] = useState<DraftMap>({})

  const selected = claims.find((c) => c.record.claim_id === selectedClaimId) ?? null

  const handleResolve = (claimId: string, resolution: Resolution) => {
    setResolutions((prev) => ({ ...prev, [claimId]: resolution }))
    setSelectedClaimId(null)
  }

  const handleDraftChange = (claimId: string, next: string) => {
    setDrafts((prev) => ({ ...prev, [claimId]: next }))
  }

  return (
    <div className="min-h-screen bg-shell">
      <AppHeader />
      {selected ? (
        <ClaimDetail
          key={selected.record.claim_id}
          claim={selected}
          resolution={resolutions[selected.record.claim_id]}
          draft={drafts[selected.record.claim_id]}
          onDraftChange={handleDraftChange}
          onBack={() => setSelectedClaimId(null)}
          onResolve={handleResolve}
        />
      ) : (
        <TriageQueue
          claims={claims}
          resolutions={resolutions}
          onOpen={setSelectedClaimId}
        />
      )}
    </div>
  )
}
