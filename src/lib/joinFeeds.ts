import type {
  Era835Record,
  MatchedDenialRecord,
  MatchKey,
  MatchStatus,
  PmsRecord,
} from '../types'

/** PMS-88213 → CLM-88213. Stable, derived, no separate ID feed to keep in sync. */
function toClaimId(patientControlNumber: string): string {
  return patientControlNumber.replace(/^PMS-/, 'CLM-')
}

/**
 * The natural key — patient, date of service, procedure code. Both feeds can
 * rebuild it independently, which is the whole reason it works as a fallback.
 */
function naturalKey(record: {
  patient_id: string
  date_of_service: string
  procedure_code: string
}): string {
  return `${record.patient_id}|${record.date_of_service}|${record.procedure_code}`
}

function groupBy<T>(items: T[], keyOf: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>()
  for (const item of items) {
    const key = keyOf(item)
    const bucket = groups.get(key)
    if (bucket) bucket.push(item)
    else groups.set(key, [item])
  }
  return groups
}

interface Assignment {
  era: Era835Record
  status: MatchStatus
  key: MatchKey
}

export interface JoinResult {
  /** One per PMS record, in feed order. The triage queue is built from these. */
  claims: MatchedDenialRecord[]
  /**
   * Remittances that found no home. These deliberately do not appear in `claims`:
   * without a PMS record there is no chart note, no patient, and no billed amount,
   * so there is nothing to render and nothing to triage. Returning them separately
   * keeps `MatchedDenialRecord` honest — every field on it is genuinely present —
   * while still refusing to drop payer data on the floor.
   */
  unmatchedRemittances: Era835Record[]
}

/**
 * Join the practice's own records to the payer's remittance.
 *
 * Primary match is the patient control number the payer echoes back. When that is
 * missing or doesn't line up — which happens for real, because control numbers get
 * truncated, re-keyed, or dropped in transit — we fall back to the natural key of
 * patient + date of service + procedure code. Fallback matches are flagged rather than
 * silently treated as clean, because a fallback match is an assumption, not a fact.
 *
 * Two passes rather than one, so the result never depends on feed order: every
 * control-number match is settled before the fallback looks at what is left over. A
 * single pass lets whichever PMS record happens to come first claim a remittance that
 * a later record would have matched exactly.
 */
export function joinFeeds(
  pmsRecords: PmsRecord[],
  era835Records: Era835Record[],
): JoinResult {
  const assignments = new Map<PmsRecord, Assignment>()
  const claimed = new Set<Era835Record>()

  // ── Pass 1 — the control number the payer echoed back ─────────────────────
  const eraByControlNumber = groupBy(
    era835Records.filter((era) => era.patient_control_number),
    (era) => era.patient_control_number,
  )

  for (const pms of pmsRecords) {
    const candidates = eraByControlNumber.get(pms.patient_control_number) ?? []
    // Two remittances on one control number is something we can't interpret, so
    // don't: fall through and let the natural key try instead.
    if (candidates.length !== 1 || claimed.has(candidates[0])) continue
    assignments.set(pms, {
      era: candidates[0],
      status: 'matched',
      key: 'patient_control_number',
    })
    claimed.add(candidates[0])
  }

  // ── Pass 2 — the natural key, over what neither side has claimed ──────────
  const pmsByNaturalKey = groupBy(
    pmsRecords.filter((pms) => !assignments.has(pms)),
    naturalKey,
  )
  const eraByNaturalKey = groupBy(
    era835Records.filter((era) => !claimed.has(era)),
    naturalKey,
  )

  for (const [key, pmsGroup] of pmsByNaturalKey) {
    const eraGroup = eraByNaturalKey.get(key) ?? []
    // One-to-one or nothing. D4341 is billed per quadrant, so patient + date +
    // procedure is not a unique key in dentistry — one patient can carry two
    // identical lines on one date. Picking between them would attach a payer's
    // denial to an arbitrary claim, and a wrong match that looks clean is worse
    // than no match at all.
    if (pmsGroup.length !== 1 || eraGroup.length !== 1) continue
    assignments.set(pmsGroup[0], {
      era: eraGroup[0],
      status: 'fallback_matched',
      key: 'patient_id+dos+procedure',
    })
    claimed.add(eraGroup[0])
  }

  // ── Flatten ───────────────────────────────────────────────────────────────
  // The PMS feed is the spine: you cannot triage a denial you have no clinical
  // record for. PMS records with no remittance stay in the result marked
  // `unmatched` rather than being dropped, so a missing remittance is visible
  // instead of invisible.
  const claims = pmsRecords.map((pms): MatchedDenialRecord => {
    const assignment = assignments.get(pms)
    const era = assignment?.era

    return {
      claim_id: toClaimId(pms.patient_control_number),
      match_status: assignment?.status ?? 'unmatched',
      match_key: assignment?.key ?? null,

      patient_control_number: pms.patient_control_number,
      patient_id: pms.patient_id,
      patient_name: pms.patient_name,
      procedure_code: pms.procedure_code,
      procedure_desc: pms.procedure_desc,
      date_of_service: pms.date_of_service,
      provider: pms.provider,
      billed_amount: pms.billed_amount,
      chart_note: pms.chart_note,
      imaging_refs: pms.imaging_refs,

      payer_claim_control_number: era?.payer_claim_control_number ?? null,
      payer_id: era?.payer_id ?? null,
      carc_code: era?.carc_code ?? null,
      carc_description: era?.carc_description ?? null,
      rarc_code: era?.rarc_code ?? null,
      rarc_description: era?.rarc_description ?? null,
      paid_amount: era?.paid_amount ?? null,
      remittance_date: era?.remittance_date ?? null,
    }
  })

  return {
    claims,
    unmatchedRemittances: era835Records.filter((era) => !claimed.has(era)),
  }
}
