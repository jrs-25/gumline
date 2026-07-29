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

  // ── Claim E — the Documentation bucket's clearest case: the evidence exists ──
  {
    claim_id: 'CLM-88342',
    category: 'Documentation',
    documentation_match: 'available_not_submitted',
    confidence: 'high',
    matched_elements: [
      'pre-operative radiographs on file (2 images, dated to the service)',
      'fracture and restoration failure described in the chart note',
    ],
    missing_elements: ['radiographs attached to the submitted claim'],
    reasoning:
      'Nothing clinical is in dispute and nothing is missing from the record — the payer asked for an attachment that was never sent. The chart references a periapical and a bitewing taken the same day as the crown, both on file, and both describe exactly the fracture the payer is questioning. This is a packaging failure rather than a documentation failure, which makes it the cheapest kind of denial to recover: the appeal is the existing evidence, resubmitted with the images attached. The filing window is the constraint here, not the case.',
    action: 'proceed_to_drafting',
    recommended_next_step:
      'Attach IMG-2026-0714-PA-30 and IMG-2026-0714-BW-R, then submit — the Crestview window closes in days, not weeks.',
    drafted_appeal:
      'RE: Appeal of denial — Claim CVD-2026-118704\nPatient: S. Whitfield (PT-4501) · Date of service: 2026-07-14 · Procedure: D2750\n\nWe are appealing the denial of D2750 issued under CARC 252 with remark code N706, indicating that documentation required to adjudicate the claim was not received.\n\nThe supporting radiographs were taken on the date of service and are attached to this appeal:\n\n1. Periapical image of #30 (IMG-2026-0714-PA-30), showing the fracture line through the distolingual cusp.\n2. Right-side bitewing (IMG-2026-0714-BW-R), showing the failed margin of the existing restoration.\n\nThe clinical record documents a full-coverage crown seated on #30 following fracture of the distolingual cusp, with failure of the prior restoration. A cusp fracture with an failing existing restoration is an accepted indication for full-coverage restoration under this plan\'s provider manual.\n\nWe respectfully request reconsideration and payment of the billed amount of $1,340.00.\n\nSubmitted by: Dr. Osei',
  },

  // ── Claim F — a second confident yes, at four times the value of Claim B ────
  {
    claim_id: 'CLM-88356',
    category: 'Clinical',
    documentation_match: 'strong',
    confidence: 'high',
    matched_elements: [
      'probing depths recorded (7-8mm at #18, #19, #20)',
      'vertical bone defects confirmed radiographically',
      'non-surgical therapy completed 2026-03-02',
      're-evaluation at eight weeks showing no improvement',
    ],
    missing_elements: [],
    reasoning:
      'The denial cites a diagnosis inconsistent with the procedure, but the record documents the standard indication for osseous surgery precisely: probing depths of 7-8mm across three contiguous teeth, vertical bone defects confirmed on imaging, and a completed course of non-surgical therapy that was re-evaluated and found to have failed. The sequence is exactly the conservative-first pathway payers ask for. Either the diagnosis code submitted on the claim does not match the charted findings, or the review did not read past the procedure code — both are answerable on this documentation.',
    action: 'proceed_to_drafting',
    recommended_next_step:
      'Review the drafted appeal, confirm the diagnosis code on the original claim, and submit.',
    drafted_appeal:
      'RE: Appeal of denial — Claim DRD-2026-452910\nPatient: T. Nakamura (PT-4508) · Date of service: 2026-06-29 · Procedure: D4260\n\nWe are appealing the denial of D4260 (osseous surgery, four or more contiguous teeth per quadrant) issued under CARC 11, "the diagnosis is inconsistent with the procedure."\n\nThe clinical record documents the accepted indication for surgical periodontal intervention in quadrant 3:\n\n1. Pre-surgical probing depths of 7-8mm at #18, #19 and #20 — three contiguous teeth, all well beyond the threshold for surgical consideration.\n2. Vertical bone defects at those sites, confirmed radiographically (ref IMG-2026-0629-PA-Q3).\n3. A completed course of scaling and root planing on 2026-03-02.\n4. Re-evaluation at eight weeks demonstrating no reduction in pocket depth.\n\nThis is the conservative-first sequence the plan\'s provider manual requires before surgical therapy is considered. The procedure followed a documented failure of non-surgical treatment, not a first-line election.\n\nWe respectfully request reconsideration and payment of the billed amount of $1,875.00. Supporting chart notes, periodontal charting and radiographs are attached.\n\nSubmitted by: Dr. Reyes',
  },

  // ── Claim G — a second case the system declines to call ─────────────────────
  {
    claim_id: 'CLM-88361',
    category: 'Clinical',
    documentation_match: 'ambiguous',
    confidence: 'low',
    matched_elements: [
      'patient-reported discomfort over several months',
      'mobility noted on examination',
    ],
    missing_elements: [
      'radiographic confirmation of pathology',
      'periodontal charting for the site',
      'documented functional impairment',
    ],
    reasoning:
      'The note records a radiograph was taken and then describes its findings as equivocal, which is the practitioner themselves declining to be certain. Intermittent discomfort and unquantified mobility may support the extraction or may not, depending on what the imaging actually shows and how the payer reads it. The record does not settle that, and neither can this system without someone looking at the image. Filing on an equivocal radiograph risks establishing a weak position on a claim that a clearer read might have won.',
    action: 'route_to_human_review',
    recommended_next_step:
      'Biller review: have the provider re-read the radiograph and state a finding, then decide whether to appeal or write off.',
  },

  // ── Claim H — a second Administrative correction, different field entirely ───
  {
    claim_id: 'CLM-88374',
    category: 'Administrative',
    documentation_match: null,
    confidence: 'high',
    matched_elements: ['subscriber ID present and verified in patient demographics'],
    missing_elements: ['subscriber ID on the submitted claim'],
    reasoning:
      'Subscriber ID missing from the submitted claim; the correct value is on file in patient demographics. Nothing clinical is in dispute — a routine prophylaxis was performed and the payer rejected the claim on a structural omission (RARC N382). Demographics hold one verified subscriber ID for this patient, so the correction is deterministic rather than a judgement call. Meridian accepts corrected claims on a resubmission clock, so no appeal is required.',
    action: 'approve_correction',
    recommended_next_step: 'Approve the correction and resubmit as a corrected claim.',
    corrected_field: 'Subscriber ID',
    corrected_value: 'MHD-4419827',
    source_of_truth: 'patient_demographics',
  },

  // ── Claim I — a second write-off, and a different reason for it ─────────────
  {
    claim_id: 'CLM-88380',
    category: 'Clinical',
    documentation_match: 'weak',
    confidence: 'high',
    matched_elements: [],
    missing_elements: [
      'radiographic evidence of pathology',
      'documented symptoms or functional impairment',
      'periodontal or restorative indication',
    ],
    reasoning:
      'The chart states the extraction was performed at the patient\'s request on an asymptomatic tooth with no radiographic pathology, no mobility and no periodontal involvement. That is an elective extraction as charted, and the payer is correct that no covered diagnosis supports it. There is no evidence to appeal with and no addendum that would change the facts — the record is complete, it simply describes something the plan does not cover. This is a patient-responsibility conversation rather than a payer one.',
    action: 'recommend_writeoff_or_addendum',
    recommended_next_step:
      'Write off $340.00 against the payer and confirm whether the patient was advised of non-coverage before treatment.',
  },

  // ── Claim J — the Documentation bucket's uncertain case ─────────────────────
  {
    claim_id: 'CLM-88391',
    category: 'Documentation',
    documentation_match: 'ambiguous',
    confidence: 'low',
    matched_elements: [
      'CBCT capture documented with surgical indication',
      'impacted teeth identified (#17, #32)',
    ],
    missing_elements: [
      'written radiographic interpretation report',
      "narrative of medical necessity in the payer's required form",
    ],
    reasoning:
      'D0367 is billed as capture *and* interpretation, and the payer has asked for the documentation supporting both. The capture is evidenced. The interpretation is described in the chart as "dictated separately," which means it may exist as a signed report, may exist as an untranscribed dictation, or may never have been completed — and which of those is true decides whether this claim is recoverable or not. That is a question about what is in the practice\'s records, not a question this system can answer from the chart note in front of it.',
    action: 'route_to_human_review',
    recommended_next_step:
      'Biller review: confirm whether a signed CBCT interpretation report exists for this study before deciding to appeal.',
  },
]

export function getClassification(claimId: string): ClassificationResult | undefined {
  return mockClassifications.find((c) => c.claim_id === claimId)
}
