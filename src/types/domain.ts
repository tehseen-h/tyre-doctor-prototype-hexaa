// TD One — domain types. Ported verbatim from project/src/types.js (Phase 1 JSDoc) to TypeScript.

export type BranchCode = 'BNE' | 'BLW' | 'COB' | 'KAL' | 'LTN' | 'MKY' | 'MUS' | 'WWY';

export interface Branch {
  code: BranchCode;
  name: string;
  region: string;
  isHq: boolean;
  open: number;
}

export interface Customer {
  id: string;
  name: string;
  ndtIntervalHours: number;
}

export interface Site {
  id: string;
  customerId: string;
  name: string;
  label: string;
}

export type PhotoKind =
  | 'serial_plate'
  | 'damage'
  | 'whole_tyre'
  | 'cavity'
  | 'repair'
  | 'rim'
  | 'crack'
  | 'rejection'
  | 'cert';

export interface Photo {
  id: string;
  kind: PhotoKind;
  stage: string;
  capturedBy: string;
  capturedAt: string;
  where: string;
  note?: string;
  queued?: boolean;
}

export interface AssetHistoryEntry {
  jobNo: string;
  date: string;
  outcome: string;
  category?: string;
}

export interface Asset {
  id: string;
  kind: 'tyre' | 'rim';
  serial: string;
  customerAssetNo?: string;
  make?: 'Bridgestone' | 'Michelin' | 'Goodyear';
  size?: string;
  fleetNo?: string;
  hoursAtRemoval?: number;
  nextNdtDueHours?: number | null;
  history?: AssetHistoryEntry[];
}

export type QuoteStatus = 'Initial' | 'Revised' | 'Final';

export interface QuoteEvent {
  status: QuoteStatus;
  at: string;
  by: string;
  reason?: string;
  photoId?: string;
}

export interface QuoteRef {
  number: string;
  status: QuoteStatus;
  history: QuoteEvent[];
}

export interface StageEvent {
  from: string;
  to: string;
  by: string;
  at: string;
  payload?: Record<string, string | number | boolean>;
  photos?: Photo[];
  overrideReason?: string;
}

export type CrackLocation = 'flange' | 'bead_seat' | 'gutter' | 'disc' | 'weld';

export interface RimFinding {
  id: string;
  location: CrackLocation;
  type: string;
  lengthMm: number;
  x: number;
  y: number;
  photoId?: string;
}

export interface Certificate {
  number: string;
  kind: 'ndt' | 'repair';
  issuedAt: string;
  technician: string;
  competencyUnit: string;
  method: string;
  nextNdtDueHours?: number;
}

export type RepairCategory = 'Minor' | 'Intermediate' | 'Major';
export type DamagePosition = 'sidewall' | 'tread' | 'shoulder' | 'bead';

export interface Job {
  jobNo: string;
  rail: 'tyre' | 'rim';
  branch: BranchCode;
  customer: string;
  site: string;
  asset: Asset;
  stage: string;
  quote?: QuoteRef;
  category?: RepairCategory;
  /** The category assumed when the quote was raised — fixed at triage/creation, never overwritten by a later inspection. Diverging from `category` is what the escalation gate compares. */
  quotedCategory?: RepairCategory;
  damagePosition?: DamagePosition;
  damageSizeMm?: number;
  beltPlyDamage?: boolean;
  cookSeconds?: number;
  cookRemaining?: number;
  repairUnit?: string;
  paused?: boolean;
  pauseReason?: string;
  outcome?: string;
  etaLabel?: string;
  visitNo?: string;
  events: StageEvent[];
  photos: Photo[];
  ndtMethod?: string;
  technician?: string;
  competencyUnit?: string;
  findings?: RimFinding[];
  certificates?: Certificate[];
}

export interface SiteVisitTyre {
  serial: string;
  make: string;
  size: string;
  fleetNo: string;
  repairable: boolean;
  position?: DamagePosition;
  sizeMm?: number;
  category?: RepairCategory;
  reason?: string;
}

export interface SiteVisit {
  visitNo: string;
  customer: string;
  site: string;
  date: string;
  branch: BranchCode;
  tyresAssessed: number;
  repairable: number;
  rejected: number;
  batchQuoteNo?: string;
  jobs: SiteVisitTyre[];
}

export type IntakeProblemCode =
  | 'duplicate_asset'
  | 'blank_serial'
  | 'unknown_serial'
  | 'size_typo'
  | 'blank_hours'
  | 'early_hours'
  | 'overdue_hours'
  | 'date_as_text'
  | 'open_job';

export type IntakeField = 'customerAssetNo' | 'rimSerial' | 'size' | 'hours' | 'removedOn';

export interface IntakeProblem {
  code: IntakeProblemCode;
  field: IntakeField;
  message: string;
  needsHuman: boolean;
}

export interface IntakeRow {
  row: number;
  customerAssetNo: string;
  rimSerial: string;
  size: string;
  fleetNo: string;
  hours: string;
  removedOn: string;
  state: 'clean' | 'held';
  problems: IntakeProblem[];
}

export interface BranchReport {
  branch: BranchCode;
  minors: number;
  intermediates: number;
  majors: number;
  jobsClosed: number;
  manHours: number;
  repairHours: number;
  rejectionRate: number;
  avgStageHours: Record<string, number>;
}

export interface EmailPreview {
  to: string;
  from: string;
  subject: string;
  lines: string[];
  thumbs?: string[];
}

export const TYPES_VERSION = 1;
