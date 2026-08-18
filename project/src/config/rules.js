// Every threshold in the interface, with the source string its tooltip shows.
// PHASE 2: make these editable/live; the UI already reads from here.

export const RULES = {
  ndtInterval: {
    value: 10000, unit: 'h', label: 'NDT due at 10,000 machine hours',
    source: "Client, on the discovery call — and +10,000 h after certification",
  },
  ndtIntervalRiskBased: {
    label: 'Interval is risk-based per mine, not universally fixed',
    source: 'Queensland Recognised Standard 13 — Tyre, Wheel and Rim Management',
    note: 'So 10,000 h reads as this customer’s interval, and is adjustable.',
  },
  ndtMethods: [
    { id: 'mpi', label: 'Magnetic particle testing', standard: 'AS 1171', source: 'AS 4457.1-2007 §4' },
    { id: 'ut', label: 'Ultrasonic testing', standard: 'AS 2207', source: 'AS 4457.1-2007 §4' },
  ],
  rimRecordFields: {
    label: 'Rim records carry NDT history, repair history, damage, position and rotation history',
    source: 'QLD Recognised Standard 13',
  },
  markingAfterRepair: {
    label: 'Repaired assemblies require marking and a report',
    source: 'AS 4457.1-2007 §5.7',
  },
  defectClassification: {
    label: 'Defects are formally classified',
    source: 'AS 4457.1-2007 Appendix B',
  },
  competencyUnits: {
    values: ['AURKTJ011', 'AURKTJ012', 'AURKTJ013', 'AURKTJ014', 'AURKTJ015', 'AURKTJ016'],
    refresherYears: 5,
    label: 'NDT technician competency unit (5-year refresher)',
    source: 'QLD Recognised Standard 13',
  },
  categories: [
    { id: 'Minor', label: 'Minor', rule: '≤ 50 mm, no belt/ply damage' },
    { id: 'Intermediate', label: 'Intermediate', rule: '50–150 mm, or a single ply affected' },
    { id: 'Major', label: 'Major', rule: '> 150 mm, multi-ply, sidewall/bead, or a section repair' },
  ],
  categorySource:
    'Our own judgement, aligned to Tire Industry Association “section repair” terminology. Adjustable — expect the client to correct these.',
  categoryNamesSource:
    'Client reports “intermediates and majors”; AURKTJ013 “Perform minor repairs to earthmoving and off-the-road tyres” confirms “minor repair” is a defined Australian competency.',
  escalation: {
    label: 'Escalation fires when measured damage moves the tyre up a category',
    source: "Client's own minor→major example",
  },
  pauseBehaviour: {
    label: 'An escalated tyre pauses; the rest of the batch keeps moving',
    source: 'Our judgement — unconfirmed, kept visible and simple so it can be corrected',
  },
  damagePositions: {
    values: ['sidewall', 'tread', 'shoulder', 'bead'],
    source: 'Client said sidewall and tread; the rest is standard tyre anatomy',
  },
  crackLocations: {
    values: ['flange', 'bead seat', 'gutter', 'disc', 'weld'],
    source: 'Standard rim anatomy',
  },
  btp: {
    label: 'BTP — blast, test, paint',
    source: "Client's own term — the clean-rim path",
  },
  retestAfterRepair: {
    label: 'Rims are re-tested after repair, before certifying',
    source: 'Our judgement — certifying an untested repair is indefensible',
  },
  cookTime: {
    label: 'Cook duration is recorded, and only flagged against the average of the same category in the data on screen',
    source: 'Client records cook duration + our judgement. No industry cure-time constant is claimed.',
  },
  intakeFlags: {
    earlyBelowHours: 9000,
    overdueAboveHours: 12000,
    label: 'Intake flags: under 9,000 h (early) or over 12,000 h (overdue), duplicate asset, unknown serial, open job exists',
    source: 'Our judgement — ±10% on the client’s 10,000 h',
  },
  quoteStatuses: {
    values: ['Initial', 'Revised', 'Final'],
    source: "The client's own words",
  },
  advanceGate: {
    label: 'A stage cannot advance without its required capture. Supervisor override allowed, but logged with a reason.',
    source: 'Our judgement — workshops need an escape hatch; the log keeps it honest',
  },
  notifications: {
    at: ['visit sent', 'received', 'escalation', 'final quote', 'dispatched'],
    label: 'Email to sales at these points',
    source: 'Client suggested email; receipt and escalation were explicit',
  },
  noPrices: {
    label: 'No prices anywhere',
    source: 'Quoting lives in NetSuite — this product holds a quote number and a status only',
  },
};

export const categoryFor = (mm, beltPly, position) => {
  if (mm > 150 || beltPly || position === 'sidewall' || position === 'bead') return 'Major';
  if (mm >= 50) return 'Intermediate';
  return 'Minor';
};
