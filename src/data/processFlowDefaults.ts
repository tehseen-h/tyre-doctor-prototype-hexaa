// Default content for the interactive process-flow diagram (/process-flow).
// Node labels/actors/captures are pulled straight from config/stages.ts so the
// diagram can never drift from the actual state machine the app runs on.
// Positions, the escalation/terminal side-branches and the annotation notes
// are hand-authored here, with notes sourced from config/rules.ts so every
// claim on the diagram is the same one the rest of the product defends.
import type { Edge, Node } from '@xyflow/react';
import { TYRE_STAGES, RIM_STAGES, TYRE_TERMINAL } from '../config/stages';
import { RULES } from '../config/rules';

export type FlowRail = 'tyre' | 'rim';
export type FlowWorld = 'field' | 'workshop' | 'office';
export type StageKind = 'stage' | 'gate' | 'decision' | 'terminal';

export interface StageNodeData extends Record<string, unknown> {
  kind: StageKind;
  label: string;
  rail: FlowRail;
  actor?: string;
  world?: FlowWorld;
  captures?: string[];
  notify?: string | null;
  notes?: string;
  collapsed?: boolean;
}

export interface NoteNodeData extends Record<string, unknown> {
  kind: 'note';
  label: string;
  notes?: string;
}

export interface LaneNodeData extends Record<string, unknown> {
  kind: 'lane';
  label: string;
  rail: FlowRail;
}

export type StageFlowNode = Node<StageNodeData, 'stage'>;
export type NoteFlowNode = Node<NoteNodeData, 'note'>;
export type LaneFlowNode = Node<LaneNodeData, 'lane'>;
export type FlowNode = StageFlowNode | NoteFlowNode | LaneFlowNode;

const TYRE_Y = 140;
const RIM_Y = 980;
const SIDE_Y = 560;
const COL = 280;

const TYRE_POSITION: Record<string, number> = {
  triaged: 40,
  initial_quote_sent: 40 + COL,
  collected: 40 + COL * 2,
  received: 40 + COL * 3,
  washed: 40 + COL * 4,
  inspected: 40 + COL * 5,
  cut_out: 40 + COL * 6,
  repaired: 40 + COL * 7,
  cooked: 40 + COL * 8,
  final_quote_sent: 40 + COL * 9,
  dispatched: 40 + COL * 10,
  closed: 40 + COL * 11,
};

const RIM_POSITION: Record<string, { x: number; y: number }> = {
  notified: { x: 40, y: RIM_Y },
  rim_received: { x: 40 + COL, y: RIM_Y },
  blasted: { x: 40 + COL * 2, y: RIM_Y },
  ndt_tested: { x: 40 + COL * 3, y: RIM_Y },
  btp: { x: 40 + COL * 4, y: RIM_Y - 190 },
  rim_repaired: { x: 40 + COL * 4, y: RIM_Y + 190 },
  retested: { x: 40 + COL * 5, y: RIM_Y + 190 },
  certified: { x: 40 + COL * 6, y: RIM_Y },
  rim_dispatched: { x: 40 + COL * 7, y: RIM_Y },
  rim_closed: { x: 40 + COL * 8, y: RIM_Y },
};

const NOTES: Record<string, string> = {
  triaged: 'Captured at the mine site by the repair manager, before the tyre ever reaches a workshop — three photos, the serial, and a repairable yes/no.',
  inspected: `${RULES.escalation.label} — source: ${RULES.escalation.source}.`,
  cut_out: `${RULES.escalation.label} — source: ${RULES.escalation.source}.`,
  cooked: `${RULES.cookTime.label} — source: ${RULES.cookTime.source}`,
  final_quote_sent: `Quote statuses: ${RULES.quoteStatuses.values.join(' → ')} — source: ${RULES.quoteStatuses.source}`,
  ndt_tested: `Methods: ${RULES.ndtMethods.map((m) => `${m.label} (${m.standard})`).join(', ')}. ${RULES.ndtIntervalRiskBased.note} — source: ${RULES.ndtInterval.source}`,
  btp: `${RULES.btp.label} — source: ${RULES.btp.source}`,
  rim_repaired: 'Sections are cut out, cracks welded, or sections replaced, then always re-tested before certifying — never certified on the strength of the original test.',
  retested: `${RULES.retestAfterRepair.label} — source: ${RULES.retestAfterRepair.source}`,
  certified: `${RULES.markingAfterRepair.label} — source: ${RULES.markingAfterRepair.source}. Next NDT due uses the ${RULES.ndtInterval.value.toLocaleString()} ${RULES.ndtInterval.unit} interval.`,
};

function stageNode(
  id: string,
  x: number,
  y: number,
  rail: FlowRail,
  kind: StageKind = 'stage',
): StageFlowNode {
  const src = (rail === 'tyre' ? TYRE_STAGES : RIM_STAGES).find((s) => s.id === id) ?? TYRE_TERMINAL;
  return {
    id,
    type: 'stage',
    position: { x, y },
    data: {
      kind: src.gate ? 'gate' : kind,
      label: src.label,
      rail,
      actor: src.actor,
      world: src.world,
      captures: src.captures,
      notify: src.notify,
      notes: NOTES[id],
      collapsed: true,
    },
  };
}

export function buildDefaultNodes(): FlowNode[] {
  const nodes: FlowNode[] = [];

  nodes.push({ id: 'lane-tyre', type: 'lane', position: { x: 40, y: TYRE_Y - 92 }, data: { kind: 'lane', label: 'TYRE REPAIR RAIL — mine site to dispatch', rail: 'tyre' } });
  for (const s of TYRE_STAGES) nodes.push(stageNode(s.id, TYRE_POSITION[s.id], TYRE_Y, 'tyre'));

  nodes.push(stageNode('not_repairable', 40, SIDE_Y, 'tyre', 'terminal'));

  nodes.push({
    id: 'escalation',
    type: 'stage',
    position: { x: TYRE_POSITION.inspected + (TYRE_POSITION.cut_out - TYRE_POSITION.inspected) / 2, y: SIDE_Y },
    data: {
      kind: 'decision',
      label: 'Escalation — worse than quoted',
      rail: 'tyre',
      actor: 'Sales',
      world: 'office',
      captures: ['Measured vs quoted category', 'Revised quote no.'],
      notify: 'Sales, then the mine once revised',
      notes: `${RULES.pauseBehaviour.label} — source: ${RULES.pauseBehaviour.source}. Shown here converging forward for clarity — in the product the job resumes at whichever stage triggered it, not necessarily "Repaired".`,
      collapsed: true,
    },
  });

  nodes.push({ id: 'lane-rim', type: 'lane', position: { x: 40, y: RIM_Y - 92 }, data: { kind: 'lane', label: 'RIM REPAIR RAIL — mine site to dispatch', rail: 'rim' } });
  for (const s of RIM_STAGES) nodes.push(stageNode(s.id, RIM_POSITION[s.id].x, RIM_POSITION[s.id].y, 'rim'));

  return nodes;
}

function e(id: string, source: string, target: string, opts: Partial<Edge> = {}): Edge {
  return {
    id,
    source,
    target,
    type: 'smoothstep',
    ...(opts.label ? { labelBgStyle: { fill: '#ffffff', fillOpacity: 1 }, labelBgPadding: [6, 3] as [number, number], labelBgBorderRadius: 4 } : {}),
    ...opts,
  };
}

export function buildDefaultEdges(): Edge[] {
  const tyreChain = TYRE_STAGES.map((s) => s.id);
  const tyreEdges = tyreChain.slice(0, -1).map((id, i) =>
    e(`e-${id}-${tyreChain[i + 1]}`, id, tyreChain[i + 1], { sourceHandle: 'right', targetHandle: 'left' }));

  const rimChainA = ['notified', 'rim_received', 'blasted', 'ndt_tested'];
  const rimChainAEdges = rimChainA.slice(0, -1).map((id, i) =>
    e(`e-${id}-${rimChainA[i + 1]}`, id, rimChainA[i + 1], { sourceHandle: 'right', targetHandle: 'left' }));

  const passFailEdges: Edge[] = [
    e('e-ndt_tested-btp', 'ndt_tested', 'btp', { sourceHandle: 'top', targetHandle: 'left', label: 'pass', style: { stroke: 'var(--td-pass)' }, labelStyle: { fill: 'var(--td-pass-deep)', fontWeight: 700 } }),
    e('e-ndt_tested-rim_repaired', 'ndt_tested', 'rim_repaired', { sourceHandle: 'bottom', targetHandle: 'left', label: 'fail', style: { stroke: 'var(--td-fail)' }, labelStyle: { fill: 'var(--td-fail-deep)', fontWeight: 700 } }),
    e('e-btp-certified', 'btp', 'certified', { sourceHandle: 'right', targetHandle: 'top' }),
    e('e-rim_repaired-retested', 'rim_repaired', 'retested', { sourceHandle: 'right', targetHandle: 'left' }),
    e('e-retested-certified', 'retested', 'certified', { sourceHandle: 'right', targetHandle: 'bottom' }),
    e('e-certified-rim_dispatched', 'certified', 'rim_dispatched', { sourceHandle: 'right', targetHandle: 'left' }),
    e('e-rim_dispatched-rim_closed', 'rim_dispatched', 'rim_closed', { sourceHandle: 'right', targetHandle: 'left' }),
  ];

  const branchEdges: Edge[] = [
    e('e-triaged-not_repairable', 'triaged', 'not_repairable', {
      sourceHandle: 'bottom', targetHandle: 'top', label: 'not repairable', style: { stroke: 'var(--td-ink-3)', strokeDasharray: '6 4' }, labelStyle: { fill: 'var(--td-ink-2)' },
    }),
    e('e-inspected-escalation', 'inspected', 'escalation', {
      sourceHandle: 'bottom', targetHandle: 'top', label: 'worse than quoted', style: { stroke: 'var(--td-hazard-deep)', strokeDasharray: '6 4' }, labelStyle: { fill: 'var(--td-hazard-deep)' },
    }),
    e('e-cut_out-escalation', 'cut_out', 'escalation', {
      sourceHandle: 'bottom', targetHandle: 'right', label: 'worse than quoted', style: { stroke: 'var(--td-hazard-deep)', strokeDasharray: '6 4' }, labelStyle: { fill: 'var(--td-hazard-deep)' },
    }),
    e('e-escalation-repaired', 'escalation', 'repaired', {
      sourceHandle: 'top', targetHandle: 'bottom', label: 'revised quote confirmed', style: { stroke: 'var(--td-hazard-deep)', strokeDasharray: '6 4' }, labelStyle: { fill: 'var(--td-hazard-deep)' },
    }),
  ];

  return [...tyreEdges, ...rimChainAEdges, ...passFailEdges, ...branchEdges];
}
