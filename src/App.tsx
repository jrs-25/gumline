import { useMemo, useState } from 'react'
import type { Resolution, ResolutionMap } from './types'
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

  const selected = claims.find((c) => c.record.claim_id === selectedClaimId) ?? null

  const handleResolve = (claimId: string, resolution: Resolution) => {
    setResolutions((prev) => ({ ...prev, [claimId]: resolution }))
    setSelectedClaimId(null)
  }

  return (
    <div className="min-h-screen bg-shell">
      <AppHeader />
      {selected ? (
        <ClaimDetail
          key={selected.record.claim_id}
          claim={selected}
          resolution={resolutions[selected.record.claim_id]}
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
