// Domain types for the denial triage prototype.
//
// Two source feeds arrive independently and get joined on patient_control_number:
// the practice management system knows what was done clinically, the 835 remittance
// knows what the payer decided. Neither alone is enough to triage a denial.

/** Feed 1 — what the practice's PMS holds about the encounter. */
export interface PmsRecord {
  patient_control_number: string
  patient_id: string
  patient_name: string
  procedure_code: string
  procedure_desc: string
  date_of_service: string
  provider: string
  billed_amount: number
  /** Free-text clinical note — the artifact the classifier actually reads. */
  chart_note: string
  imaging_refs?: string[]
}

/** Feed 2 — what the payer sent back on the 835 electronic remittance advice. */
export interface Era835Record {
  /** Echoed back by the payer; the primary join key. */
  patient_control_number: string

  // Service-line detail. A real 835 carries these — procedure code on the SVC
  // segment, service date on DTM, patient identity on NM1 — which is what makes
  // a fallback join possible at all when the control number doesn't survive.
  patient_id: string
  date_of_service: string
  procedure_code: string

  payer_claim_control_number: string
  payer_id: string
  carc_code: string
  carc_description: string
  rarc_code: string | null
  rarc_description?: string | null
  /** 0.00 on a denial. */
  paid_amount: number
  remittance_date: string
}

export type MatchStatus = 'matched' | 'fallback_matched' | 'unmatched'
export type MatchKey = 'patient_control_number' | 'patient_id+dos+procedure'

/** The joined record — both feeds flattened, plus provenance on how they were linked. */
export interface MatchedDenialRecord {
  claim_id: string
  match_status: MatchStatus
  /** Null when nothing matched, so the UI can say why rather than showing a stale key. */
  match_key: MatchKey | null

  // From the PMS feed
  patient_control_number: string
  patient_id: string
  patient_name: string
  procedure_code: string
  procedure_desc: string
  date_of_service: string
  provider: string
  billed_amount: number
  chart_note: string
  imaging_refs?: string[]

  // From the 835 feed
  payer_claim_control_number: string | null
  payer_id: string | null
  carc_code: string | null
  carc_description: string | null
  rarc_code: string | null
  rarc_description?: string | null
  paid_amount: number | null
  remittance_date: string | null
}

export type ClaimCategory = 'Administrative' | 'Documentation' | 'Clinical'

export type DocumentationMatch =
  | 'weak'
  | 'strong'
  | 'ambiguous'
  | 'available_not_submitted'
  | null

export type Confidence = 'high' | 'low'

export type ClaimAction =
  | 'recommend_writeoff_or_addendum'
  | 'proceed_to_drafting'
  | 'route_to_human_review'
  | 'approve_correction'

/**
 * Classifier output. Pre-computed mock data for the prototype — the shape is what
 * matters, and `reasoning` is deliberately first-class: the product principle is that
 * the system shows its work instead of emitting an opaque score.
 */
export interface ClassificationResult {
  claim_id: string
  category: ClaimCategory
  documentation_match: DocumentationMatch
  confidence: Confidence
  matched_elements: string[]
  missing_elements: string[]
  reasoning: string
  action: ClaimAction
  recommended_next_step: string

  /** Administrative corrections only — the value the system would write back. */
  corrected_value?: string
  corrected_field?: string
  source_of_truth?: string
  /** Claim B's pre-drafted appeal narrative; static in the prototype. */
  drafted_appeal?: string
}

/** A joined claim plus its classification, its deadline, and its rank rationale. */
export interface RankedClaim {
  record: MatchedDenialRecord
  classification: ClassificationResult
  /** ISO date the payer's filing window closes, or null if no policy applies. */
  appeal_deadline: string | null
  days_until_deadline: number | null
  /** "Appeal deadline" or "Resubmission deadline", per the payer's own policy. */
  deadline_label: string | null
  /** True when the deadline forced this claim to the top of the queue. */
  deadline_override: boolean
  /** Human-readable "why is this here" string — never a bare numeric score. */
  rationale: string
}

/**
 * How a claim was resolved by an explicit user action this session. In-memory only —
 * a reload puts the demo back to its starting state, by design.
 *
 * Claim C is deliberately absent from this union's reach: a claim routed to human
 * review has no resolution the system can apply on its own.
 */
export type Resolution = 'submitted' | 'written_off'

export type ResolutionMap = Record<string, Resolution>

/**
 * Appeal drafts the user has edited this session, keyed by claim id. Held above the
 * claim detail screen so an edit survives navigating back to the queue and reopening —
 * otherwise the "auto-saved" affordance would promise something the app doesn't do.
 * Still in-memory: a reload resets it, like everything else here.
 */
export type DraftMap = Record<string, string>
