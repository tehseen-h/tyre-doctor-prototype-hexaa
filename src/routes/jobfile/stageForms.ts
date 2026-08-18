// What the stage drawer asks for at each stage, keyed by stage id. Kept
// data-driven so StageDrawer.tsx doesn't need a bespoke branch per stage.
export type FieldType = 'text' | 'number' | 'photo' | 'yesno' | 'select' | 'cook';

export interface StageField {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  options?: string[];
  photoKind?: string;
}

export const STAGE_FIELDS: Record<string, StageField[]> = {
  triaged: [
    { key: 'quote', label: 'Quote no. (from NetSuite)', type: 'text', required: true, placeholder: 'EST-10500' },
  ],
  initial_quote_sent: [
    { key: 'carrier', label: 'Carrier', type: 'text', required: true, placeholder: 'Halberd Transport' },
    { key: 'driver', label: 'Driver', type: 'text', required: true, placeholder: 'S. Doull' },
    { key: 'date', label: 'Collection date', type: 'text', required: true, placeholder: '10 Aug 26' },
  ],
  collected: [],
  received: [
    { key: 'photo', label: 'Photo (optional)', type: 'photo', required: false, photoKind: 'whole_tyre' },
  ],
  washed: [
    { key: 'category', label: 'Confirmed repair category', type: 'select', required: true, options: ['Minor', 'Intermediate', 'Major'] },
    { key: 'sizeMm', label: 'Damage size (mm)', type: 'number', required: true, placeholder: '92' },
    { key: 'beltPly', label: 'Belt or ply damage', type: 'yesno', required: true },
    { key: 'photo', label: 'Damage photo', type: 'photo', required: true, photoKind: 'damage' },
  ],
  inspected: [
    { key: 'photo', label: 'Photo of the cut-out cavity', type: 'photo', required: true, photoKind: 'cavity' },
  ],
  cut_out: [
    { key: 'repairUnit', label: 'Repair unit / patch size', type: 'text', required: true, placeholder: 'Patch — 140 × 110 mm' },
    { key: 'photo', label: 'Repair photo', type: 'photo', required: true, photoKind: 'repair' },
  ],
  repaired: [
    { key: 'cookTarget', label: 'Cook target — hh:mm:ss', type: 'cook', required: true, placeholder: '01:30:00' },
  ],
  cooked: [], // handled by the bespoke cook/photo UI in StageDrawer, matching the approved design exactly
  final_quote_sent: [
    { key: 'destination', label: 'Destination site', type: 'text', required: true },
    { key: 'carrier', label: 'Carrier', type: 'text', required: true },
    { key: 'date', label: 'Dispatch date', type: 'text', required: true },
    { key: 'releasedBy', label: 'Released by', type: 'text', required: true },
  ],
  dispatched: [],

  // rim rail — advanced from the NDT bay / certificates screens instead of this drawer, but
  // listed here so a generic confirm still works if reached directly.
  notified: [],
  rim_received: [{ key: 'photo', label: 'Photo', type: 'photo', required: false, photoKind: 'rim' }],
  blasted: [],
  btp: [],
  rim_repaired: [{ key: 'photo', label: 'Repair photo', type: 'photo', required: true, photoKind: 'repair' }],
  retested: [],
};
