import type { Era835Record, MatchedDenialRecord, PmsRecord } from '../types'

/** PMS-88213 → CLM-88213. Stable, derived, no separate ID feed to keep in sync. */
function toClaimId(patientControlNumber: string): string {
  return patientControlNumber.replace(/^PMS-/, 'CLM-')
}

function fallbackKey(patientId: string, dos: string, procedureCode: string): string {
  return `${patientId}|${dos}|${procedureCode}`
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
 * The PMS feed is the spine: you cannot triage a denial you have no clinical record
 * for. PMS records with no remittance stay in the result set marked `unmatched` rather
 * than being dropped, so a missing remittance is visible instead of invisible.
 */
export function joinFeeds(
  pmsRecords: PmsRecord[],
  era835Records: Era835Record[],
): MatchedDenialRecord[] {
  const byControlNumber = new Map<string, Era835Record>()
  for (const era of era835Records) {
    if (era.patient_control_number) {
      byControlNumber.set(era.patient_control_number, era)
    }
  }

  // The 835 carries no patient_id or procedure code, so the fallback key has to be
  // rebuilt from whichever PMS record claims the same control number lineage. In a
  // real implementation this comes off the 837 the practice originally submitted;
  // here we index the PMS side and probe it from the remittance.
  const pmsByFallbackKey = new Map<string, PmsRecord>()
  for (const pms of pmsRecords) {
    pmsByFallbackKey.set(
      fallbackKey(pms.patient_id, pms.date_of_service, pms.procedure_code),
      pms,
    )
  }

  const consumed = new Set<Era835Record>()

  return pmsRecords.map((pms) => {
    let era: Era835Record | undefined = byControlNumber.get(pms.patient_control_number)
    let matchStatus: MatchedDenialRecord['match_status'] = 'matched'
    let matchKey: MatchedDenialRecord['match_key'] = 'patient_control_number'

    if (!era) {
      // No control-number hit — try the natural key against remittances nobody claimed.
      era = era835Records.find((candidate) => {
        if (consumed.has(candidate)) return false
        const viaFallback = pmsByFallbackKey.get(
          fallbackKey(pms.patient_id, pms.date_of_service, pms.procedure_code),
        )
        return viaFallback === pms && !byControlNumber.has(candidate.patient_control_number)
      })
      matchStatus = era ? 'fallback_matched' : 'unmatched'
      matchKey = era ? 'patient_id+dos+procedure' : null
    }

    if (era) consumed.add(era)

    return {
      claim_id: toClaimId(pms.patient_control_number),
      match_status: matchStatus,
      match_key: matchKey,

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
}
