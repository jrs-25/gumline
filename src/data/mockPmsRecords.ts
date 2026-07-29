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

  // ── Appended for queue depth. New records only, in order, because the dev
  // self-check indexes into the first four by position. ────────────────────────
  {
    patient_control_number: 'PMS-88342',
    patient_id: 'PT-4501',
    patient_name: 'S. Whitfield',
    procedure_code: 'D2750',
    procedure_desc: 'Crown — porcelain fused to high noble metal',
    date_of_service: '2026-07-14',
    provider: 'Dr. Osei',
    billed_amount: 1340.0,
    chart_note:
      'Full-coverage crown seated on #30 following fracture of the distolingual cusp. Pre-operative periapical and bitewing radiographs taken 2026-07-14 confirm the fracture line and failure of the existing restoration.',
    imaging_refs: ['IMG-2026-0714-PA-30', 'IMG-2026-0714-BW-R'],
  },
  {
    patient_control_number: 'PMS-88356',
    patient_id: 'PT-4508',
    patient_name: 'T. Nakamura',
    procedure_code: 'D4260',
    procedure_desc: 'Osseous surgery — four or more contiguous teeth per quadrant',
    date_of_service: '2026-06-29',
    provider: 'Dr. Reyes',
    billed_amount: 1875.0,
    chart_note:
      'Quadrant 3 osseous surgery. Pre-surgical probing depths of 7-8mm at #18, #19 and #20 with vertical bone defects confirmed radiographically. Scaling and root planing completed 2026-03-02, re-evaluated at eight weeks with no reduction in pocket depth.',
    imaging_refs: ['IMG-2026-0629-PA-Q3'],
  },
  {
    patient_control_number: 'PMS-88361',
    patient_id: 'PT-4512',
    patient_name: 'D. Ferraro',
    procedure_code: 'D7140',
    procedure_desc: 'Extraction — erupted tooth or exposed root',
    date_of_service: '2026-07-02',
    provider: 'Dr. Reyes',
    billed_amount: 265.0,
    chart_note:
      'Tooth #31 extracted. Patient reported intermittent discomfort over several months. Some mobility noted on examination. Radiograph taken; findings equivocal for periapical pathology.',
  },
  {
    patient_control_number: 'PMS-88374',
    patient_id: 'PT-4519',
    patient_name: 'K. Boateng',
    procedure_code: 'D1110',
    procedure_desc: 'Prophylaxis — adult',
    date_of_service: '2026-07-08',
    provider: 'Dr. Osei',
    billed_amount: 128.0,
    chart_note:
      'Routine adult prophylaxis completed. No periodontal findings of note. Recall in six months.',
  },
  {
    patient_control_number: 'PMS-88380',
    patient_id: 'PT-4524',
    patient_name: 'A. Lindqvist',
    procedure_code: 'D7210',
    procedure_desc: 'Extraction — erupted tooth requiring removal of bone',
    date_of_service: '2026-07-21',
    provider: 'Dr. Reyes',
    billed_amount: 340.0,
    chart_note:
      'Tooth #14 extracted at patient request. Tooth asymptomatic, no radiographic pathology noted, no mobility or periodontal involvement recorded.',
  },
  {
    patient_control_number: 'PMS-88391',
    patient_id: 'PT-4530',
    patient_name: 'R. Achebe',
    procedure_code: 'D0367',
    procedure_desc: 'Cone beam CT capture and interpretation — field of view of both jaws',
    date_of_service: '2026-07-25',
    provider: 'Dr. Reyes',
    billed_amount: 425.0,
    chart_note:
      'CBCT obtained for evaluation of impacted #17 and #32 prior to surgical planning. Interpretation dictated separately.',
    imaging_refs: ['IMG-2026-0725-CBCT-FULL'],
  },
]
