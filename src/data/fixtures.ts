// Canonical fixture set, typed against src/types/domain.ts. Ported from
// project/src/fixtures.js. This is the one place invented data lives — every
// serial, customer, quote and figure here is invented in the industry's own
// formats (see DECISIONS.md). Nothing here is marked sample/demo/test.
import type {
  Branch, Customer, Site, Job, Photo, SiteVisit, IntakeRow, BranchReport, EmailPreview,
} from '../types/domain';

export const BRANCHES: Branch[] = [
  { code: 'BNE', name: 'Brisbane', region: 'South East Queensland', isHq: false, open: 4 },
  { code: 'BLW', name: 'Blackwater', region: 'Bowen Basin', isHq: false, open: 3 },
  { code: 'COB', name: 'Cobar', region: 'Central West NSW', isHq: false, open: 2 },
  { code: 'KAL', name: 'Kalgoorlie', region: 'Goldfields', isHq: false, open: 5 },
  { code: 'LTN', name: 'Leeton', region: 'Riverina — head office', isHq: true, open: 0 },
  { code: 'MKY', name: 'Mackay', region: 'Bowen Basin', isHq: false, open: 17 },
  { code: 'MUS', name: 'Muswellbrook', region: 'Hunter Valley', isHq: false, open: 2 },
  { code: 'WWY', name: 'West Wyalong', region: 'Central West NSW', isHq: false, open: 1 },
];

export const CUSTOMERS: Customer[] = [
  { id: 'kurrajong', name: 'Kurrajong Coal', ndtIntervalHours: 10000 },
  { id: 'barrunga', name: 'Barrunga Iron Ore', ndtIntervalHours: 10000 },
  { id: 'marrakoo', name: 'Marrakoo Gold Operations', ndtIntervalHours: 10000 },
  { id: 'bellara', name: 'Bellara Copper', ndtIntervalHours: 10000 },
  { id: 'yandarra', name: 'Yandarra Minerals', ndtIntervalHours: 10000 },
  { id: 'wattlebank', name: 'Wattlebank Coal', ndtIntervalHours: 10000 },
];

export const SITES: Site[] = [
  { id: 'ridgeview', customerId: 'kurrajong', name: 'Ridgeview Pit', label: 'Kurrajong Coal — Ridgeview Pit' },
  { id: 'barrunga-east', customerId: 'barrunga', name: 'Barrunga East', label: 'Barrunga Iron Ore — Barrunga East' },
  { id: 'north-tailings', customerId: 'marrakoo', name: 'North Tailings', label: 'Marrakoo Gold — North Tailings' },
  { id: 'bellara-south', customerId: 'bellara', name: 'Bellara South', label: 'Bellara Copper — Bellara South' },
  { id: 'yandarra-3', customerId: 'yandarra', name: 'Pit 3', label: 'Yandarra Minerals — Pit 3' },
  { id: 'wattlebank-north', customerId: 'wattlebank', name: 'Wattlebank North', label: 'Wattlebank Coal — Wattlebank North' },
];

export interface RoleDef {
  id: string;
  label: string;
  world: 'field' | 'workshop' | 'office';
  does: string;
  entry: 'field' | 'console' | 'ndt' | 'performance';
  initials: string;
  dot: string;
}

export const ROLES: RoleDef[] = [
  { id: 'repair_manager', label: 'Tyre repair manager', world: 'field', does: 'Triage tyres at the mine, start the jobs', entry: 'field', initials: 'JW', dot: 'var(--td-hazard)' },
  { id: 'repairer', label: 'Workshop repairer', world: 'workshop', does: 'Advance stages, stage photos, cook time', entry: 'console', initials: 'TB', dot: 'var(--td-blue)' },
  { id: 'supervisor', label: 'Workshop supervisor', world: 'workshop', does: 'Receive goods, run the branch queue, override a blocked stage', entry: 'console', initials: 'MO', dot: 'var(--td-blue)' },
  { id: 'ndt_tech', label: 'NDT technician', world: 'workshop', does: 'Blast, test, record cracks, issue certificates', entry: 'ndt', initials: 'AP', dot: 'var(--td-blue)' },
  { id: 'sales', label: 'Sales', world: 'office', does: 'Read the job, raise the quote in NetSuite, answer the mine', entry: 'console', initials: 'DR', dot: 'var(--td-pass)' },
  { id: 'super', label: 'Superintendent', world: 'office', does: 'Cross-branch performance', entry: 'performance', initials: 'GS', dot: 'var(--td-pass)' },
];

const p = (
  id: string, kind: Photo['kind'], stage: string, capturedBy: string, capturedAt: string, where: string,
  note?: string, queued?: boolean,
): Photo => ({ id, kind, stage, capturedBy, capturedAt, where, note, queued: !!queued });

// ── Mackay tyre jobs ─────────────────────────────────────────────────────────
export const TYRE_JOBS: Job[] = [
  {
    jobNo: 'MKY-TR-26-0417', rail: 'tyre', branch: 'MKY', customer: 'Kurrajong Coal',
    site: 'Kurrajong Coal — Ridgeview Pit', visitNo: 'SV-26-0088',
    asset: {
      id: 'a1', kind: 'tyre', serial: 'BR7K48219', make: 'Bridgestone', size: '40.00R57', fleetNo: 'HT-412',
      history: [
        { jobNo: 'MKY-TR-25-0219', date: '14 Mar 25', outcome: 'Repaired + dispatched', category: 'Intermediate' },
        { jobNo: 'MKY-TR-24-0641', date: '02 Aug 24', outcome: 'Repaired + dispatched', category: 'Minor' },
      ],
    },
    stage: 'cooked', category: 'Major', quotedCategory: 'Intermediate', damagePosition: 'sidewall', damageSizeMm: 168, beltPlyDamage: true,
    repairUnit: 'Section repair — 220 × 160 mm', cookSeconds: 5400, cookRemaining: 4360,
    quote: {
      number: 'EST-10482', status: 'Revised', history: [
        { status: 'Initial', at: '04 Aug 26 · 07:12', by: 'D. Rennick (sales)' },
        { status: 'Revised', at: '06 Aug 26 · 14:38', by: 'D. Rennick (sales)', reason: 'Sidewall cut measured 168 mm at inspection — minor → major', photoId: 'ph-0417-insp' },
      ],
    },
    events: [
      { from: '—', to: 'triaged', by: 'J. Whelan (repair mgr)', at: '03 Aug 26 · 11:20', payload: { repairable: 'true', position: 'sidewall' } },
      { from: 'triaged', to: 'initial_quote_sent', by: 'D. Rennick (sales)', at: '04 Aug 26 · 07:12', payload: { quote: 'EST-10482' } },
      { from: 'initial_quote_sent', to: 'collected', by: 'Logistics — R. Kaur', at: '04 Aug 26 · 15:40', payload: { carrier: 'Halberd Transport', driver: 'S. Doull' } },
      { from: 'collected', to: 'received', by: 'M. Oduya (supervisor)', at: '05 Aug 26 · 08:05' },
      { from: 'received', to: 'washed', by: 'T. Barlow (repairer)', at: '05 Aug 26 · 10:52' },
      { from: 'washed', to: 'inspected', by: 'T. Barlow (repairer)', at: '06 Aug 26 · 09:14', payload: { 'damage size': '168 mm', 'belt/ply': 'yes', category: 'Major' } },
      { from: 'inspected', to: 'cut_out', by: 'T. Barlow (repairer)', at: '06 Aug 26 · 13:30' },
      { from: 'cut_out', to: 'repaired', by: 'L. Ferraro (repairer)', at: '07 Aug 26 · 11:05', payload: { 'repair unit': 'Section repair — 220 × 160 mm' } },
      { from: 'repaired', to: 'cooked', by: 'L. Ferraro (repairer)', at: '07 Aug 26 · 14:02', payload: { 'cook target': '01:30:00' } },
    ],
    photos: [
      p('ph-0417-plate', 'serial_plate', 'triaged', 'J. Whelan', '03 Aug 26 · 11:20', 'Ridgeview Pit'),
      p('ph-0417-dmg', 'damage', 'triaged', 'J. Whelan', '03 Aug 26 · 11:21', 'Ridgeview Pit', 'Sidewall, driver side'),
      p('ph-0417-whole', 'whole_tyre', 'triaged', 'J. Whelan', '03 Aug 26 · 11:22', 'Ridgeview Pit'),
      p('ph-0417-wash', 'whole_tyre', 'washed', 'T. Barlow', '05 Aug 26 · 10:52', 'Mackay'),
      p('ph-0417-insp', 'damage', 'inspected', 'T. Barlow', '06 Aug 26 · 09:12', 'Mackay', '168 mm, belt exposed'),
      p('ph-0417-cav', 'cavity', 'cut_out', 'T. Barlow', '06 Aug 26 · 13:28', 'Mackay'),
      p('ph-0417-rep', 'repair', 'repaired', 'L. Ferraro', '07 Aug 26 · 11:02', 'Mackay'),
    ],
  },
  {
    jobNo: 'MKY-TR-26-0418', rail: 'tyre', branch: 'MKY', customer: 'Kurrajong Coal',
    site: 'Kurrajong Coal — Ridgeview Pit', visitNo: 'SV-26-0088',
    asset: { id: 'a2', kind: 'tyre', serial: 'BR7K48220', make: 'Bridgestone', size: '40.00R57', fleetNo: 'HT-408', history: [] },
    stage: 'cooked', category: 'Intermediate', damagePosition: 'tread', damageSizeMm: 92, beltPlyDamage: false,
    repairUnit: 'Patch — 140 × 110 mm', cookSeconds: 3600, cookRemaining: 967,
    quote: { number: 'EST-10482', status: 'Initial', history: [{ status: 'Initial', at: '04 Aug 26 · 07:12', by: 'D. Rennick (sales)' }] },
    events: [], photos: [p('ph-0418-dmg', 'damage', 'inspected', 'T. Barlow', '06 Aug 26 · 10:40', 'Mackay')],
  },
  {
    jobNo: 'MKY-TR-26-0419', rail: 'tyre', branch: 'MKY', customer: 'Barrunga Iron Ore',
    site: 'Barrunga Iron Ore — Barrunga East', visitNo: 'SV-26-0091',
    asset: { id: 'a3', kind: 'tyre', serial: 'MC9T31104', make: 'Michelin', size: '53/80R63', fleetNo: 'HT-77', history: [] },
    stage: 'inspected', category: 'Major', quotedCategory: 'Intermediate', damagePosition: 'shoulder', damageSizeMm: 205, beltPlyDamage: true,
    paused: true, pauseReason: 'Measured 205 mm through two plies — quoted as Intermediate. Waiting on a revised quote.',
    quote: { number: 'EST-10496', status: 'Initial', history: [{ status: 'Initial', at: '05 Aug 26 · 09:03', by: 'D. Rennick (sales)' }] },
    events: [], photos: [p('ph-0419-insp', 'damage', 'inspected', 'K. Nettle', '08 Aug 26 · 07:48', 'Mackay', '205 mm, two plies')],
  },
  {
    jobNo: 'MKY-TR-26-0412', rail: 'tyre', branch: 'MKY', customer: 'Marrakoo Gold Operations',
    site: 'Marrakoo Gold — North Tailings', visitNo: 'SV-26-0084',
    asset: { id: 'a4', kind: 'tyre', serial: 'GY4L22876', make: 'Goodyear', size: '33.00R51', fleetNo: 'LD-19', history: [] },
    stage: 'washed', category: 'Intermediate', damagePosition: 'tread', damageSizeMm: 74,
    quote: { number: 'EST-10471', status: 'Initial', history: [] }, events: [], photos: [],
  },
  {
    jobNo: 'MKY-TR-26-0413', rail: 'tyre', branch: 'MKY', customer: 'Kurrajong Coal',
    site: 'Kurrajong Coal — Ridgeview Pit', visitNo: 'SV-26-0088',
    asset: { id: 'a5', kind: 'tyre', serial: 'BR7K48221', make: 'Bridgestone', size: '27.00R49', fleetNo: 'HT-401', history: [] },
    stage: 'cut_out', category: 'Intermediate', damagePosition: 'tread', damageSizeMm: 88,
    quote: { number: 'EST-10482', status: 'Initial', history: [] }, events: [], photos: [],
  },
  {
    jobNo: 'MKY-TR-26-0414', rail: 'tyre', branch: 'MKY', customer: 'Bellara Copper',
    site: 'Bellara Copper — Bellara South', visitNo: 'SV-26-0086',
    asset: { id: 'a6', kind: 'tyre', serial: 'MC9T31108', make: 'Michelin', size: '40.00R57', fleetNo: 'HT-233', history: [] },
    stage: 'repaired', category: 'Major', damagePosition: 'sidewall', damageSizeMm: 176,
    quote: { number: 'EST-10477', status: 'Revised', history: [] }, events: [], photos: [],
  },
  {
    jobNo: 'MKY-TR-26-0409', rail: 'tyre', branch: 'MKY', customer: 'Yandarra Minerals',
    site: 'Yandarra Minerals — Pit 3', visitNo: 'SV-26-0081',
    asset: { id: 'a7', kind: 'tyre', serial: 'GY4L22880', make: 'Goodyear', size: '24.00R35', fleetNo: 'LD-04', history: [] },
    stage: 'received', category: 'Minor', damagePosition: 'tread', damageSizeMm: 38,
    quote: { number: 'EST-10465', status: 'Initial', history: [] }, events: [], photos: [],
  },
  {
    jobNo: 'MKY-TR-26-0420', rail: 'tyre', branch: 'MKY', customer: 'Wattlebank Coal',
    site: 'Wattlebank Coal — Wattlebank North', visitNo: 'SV-26-0092',
    asset: { id: 'a8', kind: 'tyre', serial: 'BR7K48225', make: 'Bridgestone', size: '18.00R33', fleetNo: 'DZ-11', history: [] },
    stage: 'triaged', category: 'Minor', damagePosition: 'tread', damageSizeMm: 44,
    etaLabel: 'Awaiting quote', events: [], photos: [],
  },
  {
    jobNo: 'MKY-TR-26-0421', rail: 'tyre', branch: 'MKY', customer: 'Wattlebank Coal',
    site: 'Wattlebank Coal — Wattlebank North', visitNo: 'SV-26-0092',
    asset: { id: 'a9', kind: 'tyre', serial: 'BR7K48226', make: 'Bridgestone', size: '40.00R57', fleetNo: 'HT-118', history: [] },
    stage: 'initial_quote_sent', category: 'Intermediate', damagePosition: 'shoulder', damageSizeMm: 120,
    etaLabel: 'Pickup booked — Thu', quote: { number: 'EST-10501', status: 'Initial', history: [] }, events: [], photos: [],
  },
  {
    jobNo: 'MKY-TR-26-0422', rail: 'tyre', branch: 'MKY', customer: 'Kurrajong Coal',
    site: 'Kurrajong Coal — Ridgeview Pit', visitNo: 'SV-26-0088',
    asset: { id: 'a10', kind: 'tyre', serial: 'MC9T31112', make: 'Michelin', size: '53/80R63', fleetNo: 'HT-415', history: [] },
    stage: 'collected', category: 'Major', damagePosition: 'bead', damageSizeMm: 190,
    etaLabel: 'ETA 09 Aug · 06:30 — Halberd Transport',
    quote: { number: 'EST-10482', status: 'Initial', history: [] }, events: [], photos: [],
  },
  {
    jobNo: 'MKY-TR-26-0410', rail: 'tyre', branch: 'MKY', customer: 'Marrakoo Gold Operations',
    site: 'Marrakoo Gold — North Tailings', visitNo: 'SV-26-0084',
    asset: { id: 'a11', kind: 'tyre', serial: 'GY4L22884', make: 'Goodyear', size: '33.00R51', fleetNo: 'LD-22', history: [] },
    stage: 'final_quote_sent', category: 'Intermediate', damagePosition: 'tread', damageSizeMm: 96, cookSeconds: 3480,
    quote: { number: 'EST-10471', status: 'Final', history: [] }, events: [], photos: [],
  },
  {
    jobNo: 'MKY-TR-26-0423', rail: 'tyre', branch: 'MKY', customer: 'Wattlebank Coal',
    site: 'Wattlebank Coal — Wattlebank North', visitNo: 'SV-26-0092',
    asset: { id: 'a12', kind: 'tyre', serial: 'BR7K48227', make: 'Bridgestone', size: '40.00R57', fleetNo: 'HT-120', history: [] },
    stage: 'not_repairable', outcome: 'Not repairable — bead damage through the wire bundle, both beads',
    events: [], photos: [p('ph-0423-rej', 'rejection', 'not_repairable', 'J. Whelan', '07 Aug 26 · 10:04', 'Wattlebank North', 'Bead wire exposed both sides')],
  },
];

// ── Mackay rim jobs ──────────────────────────────────────────────────────────
export const RIM_JOBS: Job[] = [
  {
    jobNo: 'MKY-RJ-26-0132', rail: 'rim', branch: 'MKY', customer: 'Kurrajong Coal',
    site: 'Kurrajong Coal — Ridgeview Pit',
    asset: {
      id: 'r1', kind: 'rim', serial: 'RM-88-2214', customerAssetNo: 'R-4471', size: '63 in — 5-piece',
      fleetNo: 'HT-412', hoursAtRemoval: 10240, nextNdtDueHours: null,
      history: [{ jobNo: 'MKY-RJ-24-0088', date: '11 Jun 24', outcome: 'BTP + certified' }],
    },
    stage: 'ndt_tested', ndtMethod: 'Magnetic particle testing (AS 1171)', technician: 'A. Petrov',
    competencyUnit: 'AURKTJ014',
    findings: [
      { id: 'f1', location: 'gutter', type: 'Circumferential crack', lengthMm: 62, x: 50, y: 22, photoId: 'ph-0132-c1' },
      { id: 'f2', location: 'weld', type: 'Toe crack at weld', lengthMm: 24, x: 71, y: 58, photoId: 'ph-0132-c2' },
    ],
    quote: { number: 'EST-10489', status: 'Initial', history: [] },
    events: [], photos: [
      p('ph-0132-c1', 'crack', 'ndt_tested', 'A. Petrov', '08 Aug 26 · 09:31', 'Mackay', 'Gutter, 62 mm'),
      p('ph-0132-c2', 'crack', 'ndt_tested', 'A. Petrov', '08 Aug 26 · 09:36', 'Mackay', 'Weld toe, 24 mm'),
    ],
  },
  {
    jobNo: 'MKY-RJ-26-0133', rail: 'rim', branch: 'MKY', customer: 'Kurrajong Coal', site: 'Kurrajong Coal — Ridgeview Pit',
    asset: { id: 'r2', kind: 'rim', serial: 'RM-88-2215', customerAssetNo: 'R-4472', size: '63 in — 5-piece', fleetNo: 'HT-408', hoursAtRemoval: 9980, history: [] },
    stage: 'blasted', events: [], photos: [],
  },
  {
    jobNo: 'MKY-RJ-26-0134', rail: 'rim', branch: 'MKY', customer: 'Bellara Copper', site: 'Bellara Copper — Bellara South',
    asset: { id: 'r3', kind: 'rim', serial: 'RM-88-2209', customerAssetNo: 'R-4468', size: '57 in — 5-piece', fleetNo: 'HT-233', hoursAtRemoval: 10110, history: [] },
    stage: 'btp', ndtMethod: 'Ultrasonic testing (AS 2207)', technician: 'A. Petrov', competencyUnit: 'AURKTJ014',
    findings: [], events: [], photos: [],
  },
  {
    jobNo: 'MKY-RJ-26-0135', rail: 'rim', branch: 'MKY', customer: 'Barrunga Iron Ore', site: 'Barrunga Iron Ore — Barrunga East',
    asset: { id: 'r4', kind: 'rim', serial: 'RM-88-2198', customerAssetNo: 'R-4455', size: '63 in — 5-piece', fleetNo: 'HT-77', hoursAtRemoval: 12400, history: [] },
    stage: 'rim_repaired', ndtMethod: 'Magnetic particle testing (AS 1171)', technician: 'S. Ngata', competencyUnit: 'AURKTJ016',
    findings: [{ id: 'f3', location: 'flange', type: 'Radial crack', lengthMm: 41, x: 22, y: 30 }], events: [], photos: [],
  },
  {
    jobNo: 'MKY-RJ-26-0136', rail: 'rim', branch: 'MKY', customer: 'Marrakoo Gold Operations', site: 'Marrakoo Gold — North Tailings',
    asset: { id: 'r5', kind: 'rim', serial: 'RM-88-2203', customerAssetNo: 'R-4460', size: '57 in — 5-piece', fleetNo: 'LD-19', hoursAtRemoval: 10000, nextNdtDueHours: 20000, history: [] },
    stage: 'certified', ndtMethod: 'Ultrasonic testing (AS 2207)', technician: 'A. Petrov', competencyUnit: 'AURKTJ014',
    findings: [],
    certificates: [
      { number: 'NDT-MKY-26-0311', kind: 'ndt', issuedAt: '08 Aug 26', technician: 'A. Petrov', competencyUnit: 'AURKTJ014', method: 'Ultrasonic testing (AS 2207)', nextNdtDueHours: 20000 },
      { number: 'RRC-MKY-26-0311', kind: 'repair', issuedAt: '08 Aug 26', technician: 'A. Petrov', competencyUnit: 'AURKTJ014', method: 'Blast, test, paint', nextNdtDueHours: 20000 },
    ], events: [], photos: [],
  },
  {
    jobNo: 'MKY-RJ-26-0137', rail: 'rim', branch: 'MKY', customer: 'Yandarra Minerals', site: 'Yandarra Minerals — Pit 3',
    asset: { id: 'r6', kind: 'rim', serial: 'RM-88-2231', customerAssetNo: 'R-4481', size: '49 in — 3-piece', fleetNo: 'LD-04', hoursAtRemoval: 8240, history: [] },
    stage: 'rim_received', events: [], photos: [],
  },
];

export const CLOSED_JOBS: Job[] = [
  {
    jobNo: 'MKY-TR-26-0398', rail: 'tyre', branch: 'MKY', customer: 'Kurrajong Coal', site: 'Kurrajong Coal — Ridgeview Pit',
    asset: { id: 'c1', kind: 'tyre', serial: 'BR7K48201', make: 'Bridgestone', size: '40.00R57', history: [] },
    stage: 'closed', category: 'Intermediate', cookSeconds: 3540, quote: { number: 'EST-10440', status: 'Final', history: [] }, events: [], photos: [],
  },
  {
    jobNo: 'MKY-TR-26-0402', rail: 'tyre', branch: 'MKY', customer: 'Bellara Copper', site: 'Bellara Copper — Bellara South',
    asset: { id: 'c2', kind: 'tyre', serial: 'MC9T31090', make: 'Michelin', size: '33.00R51', history: [] },
    stage: 'closed', category: 'Major', cookSeconds: 5460, quote: { number: 'EST-10451', status: 'Final', history: [] }, events: [], photos: [],
  },
  {
    jobNo: 'MKY-RJ-26-0126', rail: 'rim', branch: 'MKY', customer: 'Marrakoo Gold Operations', site: 'Marrakoo Gold — North Tailings',
    asset: { id: 'c3', kind: 'rim', serial: 'RM-88-2190', customerAssetNo: 'R-4442', size: '57 in — 5-piece', hoursAtRemoval: 10380, nextNdtDueHours: 20380, history: [] },
    stage: 'rim_closed', certificates: [
      { number: 'NDT-MKY-26-0304', kind: 'ndt', issuedAt: '28 Jul 26', technician: 'S. Ngata', competencyUnit: 'AURKTJ016', method: 'Magnetic particle testing (AS 1171)', nextNdtDueHours: 20380 },
      { number: 'RRC-MKY-26-0304', kind: 'repair', issuedAt: '28 Jul 26', technician: 'S. Ngata', competencyUnit: 'AURKTJ016', method: 'Cracks welded, sections replaced', nextNdtDueHours: 20380 },
    ], events: [], photos: [],
  },
];

export const ALL_JOBS: Job[] = [...TYRE_JOBS, ...RIM_JOBS, ...CLOSED_JOBS];

export const jobsForBranch = (code: string): Job[] => (code === 'MKY' ? [...TYRE_JOBS, ...RIM_JOBS] : []);

// ── Site visit (the client's own example: 6 tyres, 5 repairable) ──────────────
export const SITE_VISIT: SiteVisit = {
  visitNo: 'SV-26-0092', customer: 'Wattlebank Coal', site: 'Wattlebank Coal — Wattlebank North',
  date: '07 Aug 26', branch: 'MKY', tyresAssessed: 6, repairable: 5, rejected: 1, batchQuoteNo: 'EST-10501',
  jobs: [
    { serial: 'BR7K48225', make: 'Bridgestone', size: '18.00R33', fleetNo: 'DZ-11', repairable: true, position: 'tread', sizeMm: 44, category: 'Minor' },
    { serial: 'BR7K48226', make: 'Bridgestone', size: '40.00R57', fleetNo: 'HT-118', repairable: true, position: 'shoulder', sizeMm: 120, category: 'Intermediate' },
    { serial: 'MC9T31119', make: 'Michelin', size: '40.00R57', fleetNo: 'HT-119', repairable: true, position: 'tread', sizeMm: 61, category: 'Intermediate' },
    { serial: 'GY4L22891', make: 'Goodyear', size: '27.00R49', fleetNo: 'LD-31', repairable: true, position: 'sidewall', sizeMm: 155, category: 'Major' },
    { serial: 'BR7K48229', make: 'Bridgestone', size: '24.00R35', fleetNo: 'LD-07', repairable: true, position: 'tread', sizeMm: 35, category: 'Minor' },
    { serial: 'BR7K48227', make: 'Bridgestone', size: '40.00R57', fleetNo: 'HT-120', repairable: false, position: 'bead', reason: 'Bead damage through the wire bundle, both beads' },
  ],
};

// ── Rim intake fixture: 18 rows → 13 clean → 5 held ──────────────────────────
// This is the EXPECTED outcome of parsing data/rim-returns-ridgeview-2026-08-08.xlsx
// for real (src/data/xlsxIntake.ts) — kept here only as the register the parser
// checks against (open jobs, known serials) and as a fallback if a browser
// blocks local file reads. INTAKE_SUMMARY numbers must match the parser's output.
const clean = (row: number, asset: string, serial: string, size: string, fleet: string, hours: number, date: string): IntakeRow =>
  ({ row, customerAssetNo: asset, rimSerial: serial, size, fleetNo: fleet, hours: String(hours), removedOn: date, state: 'clean', problems: [] });

export const INTAKE_ROWS: IntakeRow[] = [
  clean(1, 'R-4490', 'RM-88-2240', '63 in — 5-piece', 'HT-420', 10120, '02 Aug 26'),
  clean(2, 'R-4491', 'RM-88-2241', '63 in — 5-piece', 'HT-421', 9840, '02 Aug 26'),
  {
    row: 3, customerAssetNo: 'R-4492', rimSerial: 'RM-88-2242', size: '63 in — 5-piece', fleetNo: 'HT-422', hours: '8240', removedOn: '02 Aug 26', state: 'held',
    problems: [{ code: 'early_hours', field: 'hours', message: 'Back early — 8,240 h against a 10,000 h interval. Confirm before creating a job.', needsHuman: true }],
  },
  clean(4, 'R-4493', 'RM-88-2243', '57 in — 5-piece', 'LD-40', 10480, '02 Aug 26'),
  {
    row: 5, customerAssetNo: 'R-4494', rimSerial: '', size: '63 in — 5-peice', fleetNo: 'LD-41', hours: '10310', removedOn: '03 Aug 26', state: 'held',
    problems: [
      { code: 'blank_serial', field: 'rimSerial', message: 'No rim serial in the list. Type it from the rim, or hold this row.', needsHuman: true },
      { code: 'size_typo', field: 'size', message: '“5-peice” isn’t a size we hold. Did you mean 63 in — 5-piece?', needsHuman: false },
    ],
  },
  clean(6, 'R-4495', 'RM-88-2245', '57 in — 5-piece', 'LD-42', 9910, '03 Aug 26'),
  clean(7, 'R-4496', 'RM-88-2246', '63 in — 5-piece', 'HT-424', 10050, '03 Aug 26'),
  clean(8, 'R-4497', 'RM-88-2247', '49 in — 3-piece', 'DZ-14', 10220, '03 Aug 26'),
  {
    row: 9, customerAssetNo: 'R-4471', rimSerial: 'RM-88-2214', size: '63 in — 5-piece', fleetNo: 'HT-412', hours: '10240', removedOn: '04 Aug 26', state: 'held',
    problems: [{ code: 'open_job', field: 'customerAssetNo', message: 'R-4471 already has an open job — MKY-RJ-26-0132, at NDT tested.', needsHuman: true }],
  },
  clean(10, 'R-4498', 'RM-88-2248', '63 in — 5-piece', 'HT-425', 11020, '04 Aug 26'),
  clean(11, 'R-4499', 'RM-88-2249', '63 in — 5-piece', 'HT-426', 10710, '04 Aug 26'),
  clean(12, 'R-4500', 'RM-88-2250', '57 in — 5-piece', 'LD-43', 10600, '04 Aug 26'),
  {
    row: 13, customerAssetNo: 'R-4492', rimSerial: 'RM-88-2242', size: '63 in — 5-piece', fleetNo: 'HT-422', hours: '', removedOn: '05 Aug 26', state: 'held',
    problems: [
      { code: 'duplicate_asset', field: 'customerAssetNo', message: 'R-4492 appears twice in this list (rows 3 and 13). Keep one.', needsHuman: true },
      { code: 'blank_hours', field: 'hours', message: 'Hours at removal is blank — we can’t set the next NDT due without it.', needsHuman: false },
    ],
  },
  clean(14, 'R-4501', 'RM-88-2251', '63 in — 5-piece', 'HT-427', 10390, '05 Aug 26'),
  clean(15, 'R-4502', 'RM-88-2252', '63 in — 5-piece', 'HT-428', 10480, '05 Aug 26'),
  clean(16, 'R-4503', 'RM-88-2253', '57 in — 5-piece', 'LD-44', 9760, '05 Aug 26'),
  {
    row: 17, customerAssetNo: 'R-4504', rimSerial: 'RM-88-9911', size: '63 in — 5-piece', fleetNo: 'HT-429', hours: '21100', removedOn: 'last Tues', state: 'held',
    problems: [
      { code: 'overdue_hours', field: 'hours', message: 'Overdue — 21,100 h is more than double the 10,000 h interval. Confirm before creating a job.', needsHuman: true },
      { code: 'unknown_serial', field: 'rimSerial', message: 'RM-88-9911 isn’t in the rim register for Kurrajong Coal. Confirm before creating a job.', needsHuman: true },
      { code: 'date_as_text', field: 'removedOn', message: '“last Tues” isn’t a date. Pick the day it came off.', needsHuman: false },
    ],
  },
  clean(18, 'R-4505', 'RM-88-2255', '49 in — 3-piece', 'DZ-15', 10140, '06 Aug 26'),
];

export const INTAKE_SUMMARY = { rows: 18, clean: 13, held: 5, customer: 'Kurrajong Coal', file: 'Ridgeview rim returns — Aug 26.xlsx' };

// Known-open jobs and register, used by the real xlsx parser to flag "open_job" / "unknown_serial".
export const RIM_REGISTER_SERIALS = new Set([
  'RM-88-2214', 'RM-88-2215', 'RM-88-2209', 'RM-88-2198', 'RM-88-2203', 'RM-88-2231',
  'RM-88-2240', 'RM-88-2241', 'RM-88-2242', 'RM-88-2243', 'RM-88-2245', 'RM-88-2246',
  'RM-88-2247', 'RM-88-2248', 'RM-88-2249', 'RM-88-2250', 'RM-88-2251', 'RM-88-2252',
  'RM-88-2253', 'RM-88-2255', 'RM-88-2190',
]);
export const OPEN_RIM_ASSET_NOS = new Set(['R-4471']);
export const KNOWN_RIM_SIZES = ['63 in — 5-piece', '57 in — 5-piece', '49 in — 3-piece'];

// ── Branch performance ───────────────────────────────────────────────────────
export const BRANCH_REPORTS: BranchReport[] = [
  { branch: 'MKY', minors: 14, intermediates: 31, majors: 18, jobsClosed: 63, manHours: 1200, repairHours: 600, rejectionRate: 0.07, avgStageHours: { received: 6, washed: 9, inspected: 14, cut_out: 11, repaired: 19, cooked: 2 } },
  { branch: 'BLW', minors: 9, intermediates: 18, majors: 7, jobsClosed: 34, manHours: 640, repairHours: 402, rejectionRate: 0.05, avgStageHours: { received: 5, washed: 7, inspected: 12, cut_out: 10, repaired: 16, cooked: 2 } },
  { branch: 'KAL', minors: 12, intermediates: 24, majors: 12, jobsClosed: 48, manHours: 880, repairHours: 511, rejectionRate: 0.09, avgStageHours: { received: 8, washed: 11, inspected: 15, cut_out: 13, repaired: 21, cooked: 2 } },
  { branch: 'BNE', minors: 7, intermediates: 11, majors: 4, jobsClosed: 22, manHours: 410, repairHours: 268, rejectionRate: 0.04, avgStageHours: { received: 4, washed: 6, inspected: 10, cut_out: 9, repaired: 14, cooked: 2 } },
  { branch: 'MUS', minors: 6, intermediates: 13, majors: 6, jobsClosed: 25, manHours: 470, repairHours: 300, rejectionRate: 0.06, avgStageHours: { received: 6, washed: 8, inspected: 13, cut_out: 10, repaired: 17, cooked: 2 } },
  { branch: 'COB', minors: 4, intermediates: 8, majors: 3, jobsClosed: 15, manHours: 300, repairHours: 181, rejectionRate: 0.08, avgStageHours: { received: 7, washed: 9, inspected: 14, cut_out: 12, repaired: 18, cooked: 2 } },
  { branch: 'WWY', minors: 3, intermediates: 6, majors: 2, jobsClosed: 11, manHours: 220, repairHours: 140, rejectionRate: 0.05, avgStageHours: { received: 5, washed: 7, inspected: 11, cut_out: 9, repaired: 15, cooked: 2 } },
  { branch: 'LTN', minors: 0, intermediates: 0, majors: 0, jobsClosed: 0, manHours: 0, repairHours: 0, rejectionRate: 0, avgStageHours: {} },
];

// ── Email previews (no mail server; this is how we show "sales gets told") ────
export const EMAILS: Record<string, EmailPreview> = {
  visit_sent: {
    to: 'sales@tyredoctor', from: 'TD One — Mackay',
    subject: 'Initial inspection ready — Wattlebank Coal, Wattlebank North (6 tyres)',
    lines: [
      'Site visit SV-26-0092 · 07 Aug 26 · assessed by J. Whelan.',
      '6 tyres assessed — 5 repairable, 1 not repairable.',
      'Serials: BR7K48225, BR7K48226, MC9T31119, GY4L22891, BR7K48229, BR7K48227 (rejected).',
      'Quote no. (from NetSuite): not yet raised.',
    ],
    thumbs: ['damage', 'rejection'],
  },
  escalation: {
    to: 'sales@tyredoctor', from: 'TD One — Mackay',
    subject: 'Worse than quoted — MKY-TR-26-0419 (MC9T31104) now Major',
    lines: [
      'Inspected at Mackay by K. Nettle, 08 Aug 26 · 07:48.',
      'Quoted Intermediate. Measured 205 mm through two plies — now Major.',
      'Quote no. (from NetSuite): EST-10496 — needs revising.',
      'This tyre is paused. The other 3 tyres on EST-10496 are still moving.',
    ],
    thumbs: ['damage'],
  },
  final_quote: {
    to: 'sales@tyredoctor', from: 'TD One — Mackay',
    subject: 'Ready for final quote — MKY-TR-26-0410 (GY4L22884)',
    lines: [
      'Cooked 07 Aug 26, recorded 00:58:00. Ready to go out.',
      'Quote no. (from NetSuite): EST-10471 — set to Final.',
    ],
    thumbs: ['repair'],
  },
};
