/**
 * Payer policy lookup — hand-authored and deliberately tiny.
 *
 * In the real product this table's maintenance model is the hard problem (payer rules
 * change constantly and aren't published in machine-readable form). For the prototype
 * it exists so the appeal deadline is *computed* from a stated policy rather than
 * hardcoded per claim.
 */
export interface PayerPolicy {
  payer_id: string
  payer_name: string
  /** Days from remittance date in which the filing must be made. */
  appeal_window_days: number
  /**
   * Not every payer window is an appeal window. Meridian takes corrected claims on a
   * resubmission clock and has no formal appeal at all — calling that an "appeal
   * deadline" in the UI would misdescribe the payer's own policy.
   */
  deadline_type: 'appeal' | 'resubmission'
  /** How the window is described in the payer's provider manual. */
  policy_note: string
}

export const payerPolicies: PayerPolicy[] = [
  {
    payer_id: 'PAYER-DELTA-01',
    payer_name: 'Delta Regional Dental',
    appeal_window_days: 90,
    deadline_type: 'appeal',
    policy_note: 'Level 1 appeal must be filed within 90 days of remittance advice date.',
  },
  {
    payer_id: 'PAYER-MERIDIAN-02',
    payer_name: 'Meridian Health Dental',
    appeal_window_days: 180,
    deadline_type: 'resubmission',
    policy_note:
      'Corrected claims accepted within 180 days of original remittance; no formal appeal required.',
  },
  {
    payer_id: 'PAYER-CRESTVIEW-03',
    payer_name: 'Crestview Dental Plan',
    appeal_window_days: 45,
    deadline_type: 'appeal',
    policy_note:
      'Appeals must be filed within 45 days of remittance advice date. No second-level review.',
  },
  {
    payer_id: 'PAYER-NORTHSTAR-04',
    payer_name: 'Northstar Dental Benefits',
    appeal_window_days: 120,
    deadline_type: 'appeal',
    policy_note:
      'First-level appeal accepted within 120 days of remittance advice date.',
  },
]

export const DEADLINE_LABEL: Record<PayerPolicy['deadline_type'], string> = {
  appeal: 'Appeal deadline',
  resubmission: 'Resubmission deadline',
}

export function getPayerPolicy(payerId: string | null): PayerPolicy | null {
  if (!payerId) return null
  return payerPolicies.find((p) => p.payer_id === payerId) ?? null
}
