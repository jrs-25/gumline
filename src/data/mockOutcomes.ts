import type { ClaimOutcomeRecord } from '../types'

/**
 * Feed 4 — historical outcomes.
 *
 * What happened to claims the practice filed *before* the ones now in the queue. These
 * deliberately share no claim id with `mockPmsRecords`: those ten are unresolved by
 * definition, and a queue claim carrying a settled outcome would contradict the premise
 * of the demo.
 *
 * Two shapes of the data are load-bearing for what comes next:
 *
 *   1. Delta loses on D4341 medical necessity — one overturn in six filings — while
 *      winning on documentation and administrative denials. A payer track record that
 *      only aggregated to the payer would miss that entirely; the signal only appears
 *      when the slice is payer × denial reason.
 *
 *   2. Northstar has filings but no determinations yet. Any rate computed over it must
 *      come back as "not known", never as zero and never as NaN.
 *
 * Write-offs are absent on purpose. A claim the practice never filed produces no payer
 * response, so there is nothing to observe — which does mean these rates are conditioned
 * on the claims someone chose to file. That selection effect is real and is left for
 * whoever builds the aggregation into ranking.
 *
 * Dates run backwards from DEMO_TODAY (2026-09-06). Presumed outcomes sit exactly
 * PRESUMED_UPHELD_AFTER_DAYS past their filing, which `selfCheck` asserts.
 */
export const mockOutcomes: ClaimOutcomeRecord[] = [
  // ── Delta Regional Dental ───────────────────────────────────────────────────
  // Strong documentation is not enough here: three of these carried everything the
  // payer asks for and still came back upheld.
  {
    claim_id: 'CLM-87102',
    payer_claim_control_number: 'DRD-2026-401221',
    payer_id: 'PAYER-DELTA-01',
    category: 'Clinical',
    carc_code: '50',
    documentation_match: 'strong',
    action_taken: 'proceed_to_drafting',
    result: 'confirmed_overturned',
    outcome_source: 'remittance_835',
    action_date: '2026-03-12',
    outcome_date: '2026-04-28',
  },
  {
    claim_id: 'CLM-87118',
    payer_claim_control_number: 'DRD-2026-402887',
    payer_id: 'PAYER-DELTA-01',
    category: 'Clinical',
    carc_code: '50',
    documentation_match: 'strong',
    action_taken: 'proceed_to_drafting',
    result: 'confirmed_upheld',
    outcome_source: 'biller_confirmation',
    action_date: '2026-03-20',
    outcome_date: '2026-05-11',
  },
  {
    claim_id: 'CLM-87133',
    payer_claim_control_number: 'DRD-2026-404190',
    payer_id: 'PAYER-DELTA-01',
    category: 'Clinical',
    carc_code: '50',
    documentation_match: 'ambiguous',
    action_taken: 'route_to_human_review',
    result: 'confirmed_upheld',
    outcome_source: 'biller_confirmation',
    action_date: '2026-04-02',
    outcome_date: '2026-05-26',
  },
  {
    claim_id: 'CLM-87147',
    payer_claim_control_number: 'DRD-2026-405622',
    payer_id: 'PAYER-DELTA-01',
    category: 'Clinical',
    carc_code: '50',
    documentation_match: 'strong',
    action_taken: 'proceed_to_drafting',
    result: 'confirmed_upheld',
    outcome_source: 'biller_confirmation',
    action_date: '2026-04-15',
    outcome_date: '2026-06-08',
  },
  {
    claim_id: 'CLM-87161',
    payer_claim_control_number: 'DRD-2026-407013',
    payer_id: 'PAYER-DELTA-01',
    category: 'Documentation',
    carc_code: '252',
    documentation_match: 'available_not_submitted',
    action_taken: 'proceed_to_drafting',
    result: 'confirmed_overturned',
    outcome_source: 'remittance_835',
    action_date: '2026-04-27',
    outcome_date: '2026-06-03',
  },
  {
    claim_id: 'CLM-87175',
    payer_claim_control_number: 'DRD-2026-408455',
    payer_id: 'PAYER-DELTA-01',
    category: 'Clinical',
    carc_code: '50',
    documentation_match: 'ambiguous',
    action_taken: 'route_to_human_review',
    result: 'presumed_upheld',
    outcome_source: 'timeout_inference',
    action_date: '2026-05-06',
    outcome_date: '2026-07-05',
  },
  {
    claim_id: 'CLM-87190',
    payer_claim_control_number: 'DRD-2026-409901',
    payer_id: 'PAYER-DELTA-01',
    category: 'Administrative',
    carc_code: '16',
    documentation_match: null,
    action_taken: 'approve_correction',
    result: 'confirmed_overturned',
    outcome_source: 'remittance_835',
    action_date: '2026-05-18',
    outcome_date: '2026-06-09',
  },
  {
    claim_id: 'CLM-87204',
    payer_claim_control_number: 'DRD-2026-411238',
    payer_id: 'PAYER-DELTA-01',
    category: 'Documentation',
    carc_code: '252',
    documentation_match: 'available_not_submitted',
    action_taken: 'proceed_to_drafting',
    result: 'confirmed_overturned',
    outcome_source: 'remittance_835',
    action_date: '2026-06-01',
    outcome_date: '2026-07-07',
  },
  {
    // The original claim never matched a remittance, so no payer control number was
    // ever learned. Nothing on the 835 channel can close this one out; only a person
    // calling the payer could.
    claim_id: 'CLM-87219',
    payer_claim_control_number: null,
    payer_id: 'PAYER-DELTA-01',
    category: 'Clinical',
    carc_code: '50',
    documentation_match: 'strong',
    action_taken: 'proceed_to_drafting',
    result: 'presumed_upheld',
    outcome_source: 'timeout_inference',
    action_date: '2026-06-14',
    outcome_date: '2026-08-13',
  },
  {
    claim_id: 'CLM-87233',
    payer_claim_control_number: 'DRD-2026-413770',
    payer_id: 'PAYER-DELTA-01',
    category: 'Clinical',
    carc_code: '11',
    documentation_match: 'ambiguous',
    action_taken: 'route_to_human_review',
    result: 'pending',
    outcome_source: null,
    action_date: '2026-07-28',
    outcome_date: null,
  },

  // ── Meridian Health Dental ──────────────────────────────────────────────────
  // Corrected claims on a resubmission clock. These close on the 835 channel both
  // ways: a resubmission that is denied again comes back as a remittance too, which
  // is why a confirmed_upheld here is observed rather than inferred.
  {
    claim_id: 'CLM-87255',
    payer_claim_control_number: 'MHD-2026-750112',
    payer_id: 'PAYER-MERIDIAN-02',
    category: 'Administrative',
    carc_code: '16',
    documentation_match: null,
    action_taken: 'approve_correction',
    result: 'confirmed_overturned',
    outcome_source: 'remittance_835',
    action_date: '2026-04-08',
    outcome_date: '2026-04-29',
  },
  {
    claim_id: 'CLM-87268',
    payer_claim_control_number: 'MHD-2026-752304',
    payer_id: 'PAYER-MERIDIAN-02',
    category: 'Administrative',
    carc_code: '16',
    documentation_match: null,
    action_taken: 'approve_correction',
    result: 'confirmed_overturned',
    outcome_source: 'remittance_835',
    action_date: '2026-04-22',
    outcome_date: '2026-05-13',
  },
  {
    claim_id: 'CLM-87281',
    payer_claim_control_number: 'MHD-2026-754889',
    payer_id: 'PAYER-MERIDIAN-02',
    category: 'Administrative',
    carc_code: '16',
    documentation_match: null,
    action_taken: 'approve_correction',
    result: 'confirmed_overturned',
    outcome_source: 'remittance_835',
    action_date: '2026-05-19',
    outcome_date: '2026-06-10',
  },
  {
    claim_id: 'CLM-87294',
    payer_claim_control_number: 'MHD-2026-757201',
    payer_id: 'PAYER-MERIDIAN-02',
    category: 'Documentation',
    carc_code: '252',
    documentation_match: 'available_not_submitted',
    action_taken: 'proceed_to_drafting',
    result: 'confirmed_upheld',
    outcome_source: 'remittance_835',
    action_date: '2026-06-02',
    outcome_date: '2026-07-14',
  },
  {
    claim_id: 'CLM-87320',
    payer_claim_control_number: 'MHD-2026-761988',
    payer_id: 'PAYER-MERIDIAN-02',
    category: 'Documentation',
    carc_code: '252',
    documentation_match: 'available_not_submitted',
    action_taken: 'proceed_to_drafting',
    result: 'confirmed_overturned',
    outcome_source: 'remittance_835',
    action_date: '2026-06-24',
    outcome_date: '2026-07-30',
  },
  {
    claim_id: 'CLM-87307',
    payer_claim_control_number: 'MHD-2026-759644',
    payer_id: 'PAYER-MERIDIAN-02',
    category: 'Administrative',
    carc_code: '16',
    documentation_match: null,
    action_taken: 'approve_correction',
    result: 'pending',
    outcome_source: null,
    action_date: '2026-08-05',
    outcome_date: null,
  },

  // ── Crestview Dental Plan ───────────────────────────────────────────────────
  {
    claim_id: 'CLM-87340',
    payer_claim_control_number: 'CVD-2026-101445',
    payer_id: 'PAYER-CRESTVIEW-03',
    category: 'Documentation',
    carc_code: '252',
    documentation_match: 'available_not_submitted',
    action_taken: 'proceed_to_drafting',
    result: 'confirmed_overturned',
    outcome_source: 'remittance_835',
    action_date: '2026-04-11',
    outcome_date: '2026-05-20',
  },
  {
    claim_id: 'CLM-87353',
    payer_claim_control_number: 'CVD-2026-103772',
    payer_id: 'PAYER-CRESTVIEW-03',
    category: 'Clinical',
    carc_code: '167',
    documentation_match: 'ambiguous',
    action_taken: 'route_to_human_review',
    result: 'confirmed_upheld',
    outcome_source: 'biller_confirmation',
    action_date: '2026-05-02',
    outcome_date: '2026-06-15',
  },
  {
    claim_id: 'CLM-87366',
    payer_claim_control_number: 'CVD-2026-106018',
    payer_id: 'PAYER-CRESTVIEW-03',
    category: 'Clinical',
    carc_code: '167',
    documentation_match: 'strong',
    action_taken: 'proceed_to_drafting',
    result: 'confirmed_overturned',
    outcome_source: 'remittance_835',
    action_date: '2026-05-27',
    outcome_date: '2026-07-02',
  },
  {
    claim_id: 'CLM-87379',
    payer_claim_control_number: 'CVD-2026-108330',
    payer_id: 'PAYER-CRESTVIEW-03',
    category: 'Documentation',
    carc_code: '252',
    documentation_match: 'available_not_submitted',
    action_taken: 'proceed_to_drafting',
    result: 'presumed_upheld',
    outcome_source: 'timeout_inference',
    action_date: '2026-06-18',
    outcome_date: '2026-08-17',
  },
  {
    claim_id: 'CLM-87392',
    payer_claim_control_number: 'CVD-2026-110774',
    payer_id: 'PAYER-CRESTVIEW-03',
    category: 'Clinical',
    carc_code: '167',
    documentation_match: 'ambiguous',
    action_taken: 'route_to_human_review',
    result: 'pending',
    outcome_source: null,
    action_date: '2026-08-12',
    outcome_date: null,
  },

  // ── Northstar Dental Benefits ───────────────────────────────────────────────
  // Filed, nothing back yet. Every one of these is pending, which is the case an
  // overturn rate has to survive without inventing a number.
  {
    claim_id: 'CLM-87410',
    payer_claim_control_number: 'NDB-2026-650221',
    payer_id: 'PAYER-NORTHSTAR-04',
    category: 'Documentation',
    carc_code: '252',
    documentation_match: 'available_not_submitted',
    action_taken: 'proceed_to_drafting',
    result: 'pending',
    outcome_source: null,
    action_date: '2026-08-19',
    outcome_date: null,
  },
  {
    claim_id: 'CLM-87423',
    payer_claim_control_number: 'NDB-2026-652889',
    payer_id: 'PAYER-NORTHSTAR-04',
    category: 'Clinical',
    carc_code: '167',
    documentation_match: 'strong',
    action_taken: 'proceed_to_drafting',
    result: 'pending',
    outcome_source: null,
    action_date: '2026-08-26',
    outcome_date: null,
  },
  {
    claim_id: 'CLM-87436',
    payer_claim_control_number: 'NDB-2026-655103',
    payer_id: 'PAYER-NORTHSTAR-04',
    category: 'Administrative',
    carc_code: '16',
    documentation_match: null,
    action_taken: 'approve_correction',
    result: 'pending',
    outcome_source: null,
    action_date: '2026-09-01',
    outcome_date: null,
  },
]
