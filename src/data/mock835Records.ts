import type { Era835Record } from '../types'

/**
 * Feed 2 — 835 electronic remittance advice.
 *
 * The first three are the crux of the demo: one payer, one denial code, three claims
 * that are byte-for-byte identical here apart from the control number. Any system that
 * triages on the remittance alone has no way to tell them apart.
 */
export const mock835Records: Era835Record[] = [
  {
    patient_control_number: 'PMS-88213',
    patient_id: 'PT-4471',
    date_of_service: '2026-06-02',
    procedure_code: 'D4341',
    payer_claim_control_number: 'DRD-2026-441182',
    payer_id: 'PAYER-DELTA-01',
    carc_code: '50',
    carc_description: 'Not deemed a medical necessity',
    rarc_code: null,
    rarc_description: null,
    paid_amount: 0.0,
    remittance_date: '2026-06-19',
  },
  {
    patient_control_number: 'PMS-88214',
    patient_id: 'PT-4472',
    date_of_service: '2026-06-02',
    procedure_code: 'D4341',
    payer_claim_control_number: 'DRD-2026-441183',
    payer_id: 'PAYER-DELTA-01',
    carc_code: '50',
    carc_description: 'Not deemed a medical necessity',
    rarc_code: null,
    rarc_description: null,
    paid_amount: 0.0,
    remittance_date: '2026-06-19',
  },
  {
    patient_control_number: 'PMS-88215',
    patient_id: 'PT-4473',
    date_of_service: '2026-06-03',
    procedure_code: 'D4341',
    payer_claim_control_number: 'DRD-2026-441184',
    payer_id: 'PAYER-DELTA-01',
    carc_code: '50',
    carc_description: 'Not deemed a medical necessity',
    rarc_code: null,
    rarc_description: null,
    paid_amount: 0.0,
    remittance_date: '2026-06-20',
  },
  {
    patient_control_number: 'PMS-88301',
    patient_id: 'PT-4480',
    date_of_service: '2026-06-04',
    procedure_code: 'D2740',
    payer_claim_control_number: 'MHD-2026-773901',
    payer_id: 'PAYER-MERIDIAN-02',
    carc_code: '16',
    carc_description: 'Claim/service lacks information or has submission/billing error(s)',
    rarc_code: 'N264',
    rarc_description: 'Missing/incomplete/invalid ordering provider name or NPI',
    paid_amount: 0.0,
    remittance_date: '2026-06-21',
  },
]
