import type { PmsRecord } from '../types'

/**
 * Feed 1 — practice management system export.
 *
 * Note that the three D4341 records are near-identical on every structured field:
 * same code, same provider, same week, similar amounts. The only thing that separates
 * them is the free-text chart note. That is the whole premise of the demo.
 */
export const mockPmsRecords: PmsRecord[] = [
  {
    patient_control_number: 'PMS-88213',
    patient_id: 'PT-4471',
    patient_name: 'J. Alvarez',
    procedure_code: 'D4341',
    procedure_desc: 'Periodontal scaling and root planing — four or more teeth per quadrant',
    date_of_service: '2026-06-02',
    provider: 'Dr. Osei',
    billed_amount: 285.0,
    chart_note: 'Perio maintenance performed, patient tolerated well, return in 3 months.',
  },
  {
    patient_control_number: 'PMS-88214',
    patient_id: 'PT-4472',
    patient_name: 'R. Chen',
    procedure_code: 'D4341',
    procedure_desc: 'Periodontal scaling and root planing — four or more teeth per quadrant',
    date_of_service: '2026-06-02',
    provider: 'Dr. Osei',
    billed_amount: 310.0,
    chart_note:
      '5-6mm pockets, quadrants 2 and 3, bleeding on probing at 8 sites, radiographic evidence of horizontal bone loss, patient previously completed non-surgical therapy without resolution.',
    imaging_refs: ['IMG-2026-0602-BW-R-CHEN', 'IMG-2026-0602-PA-Q2'],
  },
  {
    patient_control_number: 'PMS-88215',
    patient_id: 'PT-4473',
    patient_name: 'M. Okafor',
    procedure_code: 'D4341',
    procedure_desc: 'Periodontal scaling and root planing — four or more teeth per quadrant',
    date_of_service: '2026-06-03',
    provider: 'Dr. Osei',
    billed_amount: 298.0,
    chart_note:
      '4-5mm pockets noted in quadrant 1, mild bleeding on probing at 3 sites. Patient reports occasional sensitivity. Recommend re-evaluation at next visit.',
  },
  {
    patient_control_number: 'PMS-88301',
    patient_id: 'PT-4480',
    patient_name: 'L. Park',
    procedure_code: 'D2740',
    procedure_desc: 'Crown — porcelain/ceramic',
    date_of_service: '2026-06-04',
    provider: 'Dr. Osei',
    billed_amount: 1150.0,
    chart_note:
      'Crown seated on #14, margins verified, occlusion adjusted, patient comfortable at dismissal.',
  },
]
