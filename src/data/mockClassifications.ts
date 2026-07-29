import type { ClassificationResult } from '../types'

/**
 * Pre-computed classifier output, one per claim.
 *
 * In the product these come from a model reading the chart note against the payer's
 * medical-necessity criteria. Here they are fixed mock data so the demo is deterministic
 * — but the shape is the real contract, and `reasoning` is what the UI leads with.
 */
export const mockClassifications: ClassificationResult[] = [
  // ── Claim A — same denial code as B and C, opposite conclusion ──────────────
  {
    claim_id: 'CLM-88213',
    category: 'Clinical',
    documentation_match: 'weak',
    confidence: 'high',
    matched_elements: [],
    missing_elements: [
      'pocket depths',
      'bleeding on probing',
      'radiographic evidence of bone loss',
      'documented history of failed non-surgical therapy',
    ],
    reasoning:
      'The chart note documents a maintenance visit, not active periodontal disease. It records no pocket depths, no bleeding on probing, no radiographic findings, and no history of failed non-surgical therapy — none of the four elements this payer requires to establish medical necessity for D4341. There is no evidence in the record to appeal with; an appeal filed on this documentation would be denied again. If the clinical findings existed but went unrecorded, a provider addendum is the only path that changes the outcome.',
    action: 'recommend_writeoff_or_addendum',
    recommended_next_step:
      'Write off $285.00, or request a provider addendum if the supporting findings were observed but not charted.',
  },

  // ── Claim B — same denial code as A and C, strong record ───────────────────
  {
    claim_id: 'CLM-88214',
    category: 'Clinical',
    documentation_match: 'strong',
    confidence: 'high',
    matched_elements: [
      'pocket depths recorded (5-6mm)',
      'bleeding on probing (8 sites)',
      'radiographic bone loss',
      'failed prior therapy',
    ],
    missing_elements: [],
    reasoning:
      'The chart note satisfies all four medical-necessity criteria this payer applies to D4341: pocket depths of 5-6mm across quadrants 2 and 3, bleeding on probing at 8 sites, radiographic evidence of horizontal bone loss, and a documented course of non-surgical therapy that failed to resolve. The denial appears to be a default response to the procedure code rather than a review of the submitted record. An appeal citing these four findings has a strong basis.',
    action: 'proceed_to_drafting',
    recommended_next_step:
      'Review the drafted appeal and submit before the payer window closes.',
    drafted_appeal:
      'RE: Appeal of denial — Claim DRD-2026-441183\nPatient: R. Chen (PT-4472) · Date of service: 2026-06-02 · Procedure: D4341\n\nWe are appealing the denial of D4341 (periodontal scaling and root planing, four or more teeth per quadrant) issued under CARC 50, "not deemed a medical necessity."\n\nThe clinical record documents each element required to establish medical necessity for this procedure:\n\n1. Periodontal pocket depths of 5-6mm in quadrants 2 and 3, exceeding the 4mm threshold for active periodontal disease.\n2. Bleeding on probing at 8 discrete sites, indicating active inflammation rather than a stable maintenance presentation.\n3. Radiographic evidence of horizontal bone loss, confirmed on bitewing and periapical imaging taken 2026-06-02 (refs IMG-2026-0602-BW-R-CHEN, IMG-2026-0602-PA-Q2).\n4. A documented prior course of non-surgical periodontal therapy completed without resolution of the above findings.\n\nTaken together these findings meet the criteria published in the plan\'s provider manual for scaling and root planing. The procedure was not preventive maintenance; it was treatment of diagnosed active periodontal disease following the failure of a more conservative approach.\n\nWe respectfully request reconsideration and payment of the billed amount of $310.00. Supporting chart notes and radiographs are attached.\n\nSubmitted by: Dr. Osei',
  },

  // ── Claim C — same denial code again, and the system declines to be certain ─
  {
    claim_id: 'CLM-88215',
    category: 'Clinical',
    documentation_match: 'ambiguous',
    confidence: 'low',
    matched_elements: [
      'pocket depths recorded (4-5mm)',
      'bleeding on probing (limited: 3 sites)',
    ],
    missing_elements: [
      'radiographic evidence of bone loss',
      'documented history of failed non-surgical therapy',
    ],
    reasoning:
      'This record sits below the threshold where the outcome is predictable. Pocket depths of 4-5mm and bleeding at 3 sites are documented, but both fall at the low end of what this payer accepts as active periodontal disease, and the note itself hedges — "recommend re-evaluation at next visit" reads closer to monitoring than to treatment of established disease. No radiographic findings or prior failed therapy are recorded. The appeal could succeed on a favourable read of the pocket depths or fail on the absence of imaging; the documentation does not settle it. This needs a person who can look at the imaging and the patient history and make the call.',
    action: 'route_to_human_review',
    recommended_next_step:
      'Biller review: check whether radiographs from this visit support bone loss, and whether prior therapy exists in the patient history.',
  },

  // ── Claim D — a different failure mode entirely: nothing clinical is wrong ──
  {
    claim_id: 'CLM-88301',
    category: 'Administrative',
    documentation_match: null,
    confidence: 'high',
    matched_elements: ['ordering provider NPI present in practice roster'],
    missing_elements: ['ordering provider NPI on submitted claim'],
    reasoning:
      'Ordering provider NPI missing; correct value available in provider roster. Nothing clinical is in dispute — the payer rejected the claim on a structural omission (RARC N264). The roster holds a single unambiguous NPI for Dr. Osei, so the correction is deterministic rather than a judgement call. Once the field is populated the claim can be resubmitted as a corrected claim; no appeal is required.',
    action: 'approve_correction',
    recommended_next_step:
      'Approve the correction and resubmit as a corrected claim.',
    corrected_field: 'Ordering Provider NPI',
    corrected_value: '1861794572',
    source_of_truth: 'provider_roster',
  },
]

export function getClassification(claimId: string): ClassificationResult | undefined {
  return mockClassifications.find((c) => c.claim_id === claimId)
}
