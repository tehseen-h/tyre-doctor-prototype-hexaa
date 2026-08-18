// Declarative stage definitions — the ordered rails, their actors, required
// captures and notifications. Components read stage order from here.
// PHASE 2: this table becomes the state machine.

export const TYRE_STAGES = [
  { id: 'triaged', label: 'Triaged', actor: 'Repair manager', world: 'field',
    captures: ['3 photos (serial plate / damage / whole tyre)', 'Tyre serial', 'Repairable yes/no', 'Damage position'],
    notify: 'Sales — initial inspection ready + batch summary', bay: 'on_the_way' },
  { id: 'initial_quote_sent', label: 'Initial quote sent', actor: 'Sales', world: 'office',
    captures: ['Quote no. (from NetSuite)'], notify: 'Logistics — collect these', bay: 'on_the_way' },
  { id: 'collected', label: 'Collected', actor: 'Logistics', world: 'office',
    captures: ['Carrier', 'Driver', 'Date'], notify: null, bay: 'on_the_way' },
  { id: 'received', label: 'Received', actor: 'Supervisor / repairer', world: 'workshop',
    captures: ['Confirm arrival (one tap per tyre)'], notify: 'Sales', bay: 'wash' },
  { id: 'washed', label: 'Washed', actor: 'Repairer', world: 'workshop',
    captures: ['Tap through', 'Photo (optional)'], notify: null, bay: 'wash' },
  { id: 'inspected', label: 'Inspected', actor: 'Repairer', world: 'workshop',
    captures: ['Confirmed repair category', 'Damage size (mm)', 'Belt/ply damage yes/no', 'Photos'],
    notify: 'Escalation if category rises', gate: true, bay: 'inspect' },
  { id: 'cut_out', label: 'Cut out', actor: 'Repairer', world: 'workshop',
    captures: ['Photos of the cut-out cavity'], notify: 'Escalation if category rises', gate: true, bay: 'cut_out' },
  { id: 'repaired', label: 'Repaired', actor: 'Repairer', world: 'workshop',
    captures: ['Repair unit / patch size', 'Photos'], notify: null, bay: 'fill' },
  { id: 'cooked', label: 'Cooked', actor: 'Repairer', world: 'workshop',
    captures: ['Cook duration — live timer or typed entry'], notify: null, bay: 'oven' },
  { id: 'final_quote_sent', label: 'Final quote sent', actor: 'Sales', world: 'office',
    captures: ['Quote status → Final'], notify: 'Customer', bay: 'ready' },
  { id: 'dispatched', label: 'Dispatched', actor: 'Logistics / supervisor', world: 'office',
    captures: ['Destination site', 'Carrier', 'Date', 'Released by'], notify: 'Sales', bay: 'ready' },
  { id: 'closed', label: 'Closed', actor: '—', world: 'office', captures: [], notify: null, bay: null },
];

export const TYRE_TERMINAL = {
  id: 'not_repairable', label: 'Not repairable', actor: 'Repair manager / repairer', world: 'field',
  captures: ['Reason', 'Photos'], notify: 'Sales', bay: null,
};

export const RIM_STAGES = [
  { id: 'notified', label: 'Notified', actor: 'Sales / supervisor', world: 'office',
    captures: ["The mine's list of returned rims"], notify: null, bay: 'on_the_way' },
  { id: 'rim_received', label: 'Received', actor: 'Supervisor', world: 'workshop',
    captures: ['Rim IDs confirmed', 'Photos'], notify: 'Sales', bay: 'rim_blast' },
  { id: 'blasted', label: 'Blasted', actor: 'NDT technician', world: 'workshop',
    captures: ['Tap through'], notify: null, bay: 'rim_blast' },
  { id: 'ndt_tested', label: 'NDT tested', actor: 'NDT technician', world: 'workshop',
    captures: ['Method (magnetic particle / ultrasonic)', 'Technician + competency unit', 'Pass / fail', 'On fail: crack list pinned to rim locations + photos'],
    notify: 'On fail → sales', gate: true, bay: 'rim_ndt' },
  { id: 'btp', label: 'BTP', actor: 'NDT technician', world: 'workshop', path: 'pass',
    captures: ['Blast, test, paint confirmed'], notify: null, bay: 'rim_btp' },
  { id: 'rim_repaired', label: 'Rim repaired', actor: 'Repairer', world: 'workshop', path: 'fail',
    captures: ['Sections cut out / cracks welded / sections replaced', 'Photos'], notify: null, bay: 'rim_ndt' },
  { id: 'retested', label: 'Re-tested', actor: 'NDT technician', world: 'workshop', path: 'fail',
    captures: ['Retest result'], notify: null, bay: 'rim_ndt' },
  { id: 'certified', label: 'Certified', actor: 'NDT tech / supervisor', world: 'workshop',
    captures: ['Rim NDT Certificate', 'Rim Repair Certificate', 'Next NDT due (hours)'],
    notify: 'Sales + customer', bay: 'ready' },
  { id: 'rim_dispatched', label: 'Dispatched', actor: 'Logistics / supervisor', world: 'office',
    captures: ['Destination site', 'Carrier', 'Date', 'Released by'], notify: 'Sales', bay: 'ready' },
  { id: 'rim_closed', label: 'Closed', actor: '—', world: 'office', captures: [], notify: null, bay: null },
];

export const BAYS = [
  { id: 'on_the_way', label: 'On the way', kicker: 'inbound', icon: 'truck' },
  { id: 'wash', label: 'Wash bay', kicker: 'received + washed', icon: 'droplets' },
  { id: 'inspect', label: 'Inspect', kicker: 'measure + categorise', icon: 'search' },
  { id: 'cut_out', label: 'Cut out', kicker: 'cavity opened', icon: 'cavity' },
  { id: 'fill', label: 'Fill / repair', kicker: 'rubber in', icon: 'fill' },
  { id: 'oven', label: 'The cook oven', kicker: 'hot vulcanising', icon: 'oven' },
  { id: 'rim_blast', label: 'Rim side — blast', kicker: 'blast booth', icon: 'nozzle' },
  { id: 'rim_ndt', label: 'Rim side — NDT', kicker: 'crack testing', icon: 'crack' },
  { id: 'rim_btp', label: 'Rim side — BTP', kicker: 'blast, test, paint', icon: 'paint' },
  { id: 'ready', label: 'Ready to go out', kicker: 'quoted + released', icon: 'docket' },
];

export const stageById = (id) =>
  TYRE_STAGES.find((s) => s.id === id) ||
  RIM_STAGES.find((s) => s.id === id) ||
  (TYRE_TERMINAL.id === id ? TYRE_TERMINAL : null);

export const railStages = (rail) => (rail === 'rim' ? RIM_STAGES : TYRE_STAGES);

export const stageIndex = (rail, id) => railStages(rail).findIndex((s) => s.id === id);
