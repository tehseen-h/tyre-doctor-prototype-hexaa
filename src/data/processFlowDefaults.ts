// Default content for the interactive process-flow diagram (/process-flow).
// Node labels/actors/captures are pulled straight from config/stages.ts so the
// diagram can never drift from the actual state machine the app runs on.
// Stages are clustered into a handful of phase GROUPS so the diagram opens as
// a small, high-level flow; clicking a group reveals the real stage cards it
// stands for. Notes are sourced from config/rules.ts so every claim on the
// diagram is the same one the rest of the product defends.
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
  groupId?: string;
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

export interface GroupNodeData extends Record<string, unknown> {
  kind: 'group';
  label: string;
  rail: FlowRail;
  summary: string;
  count: number;
  expanded?: boolean;
}

export type StageFlowNode = Node<StageNodeData, 'stage'>;
export type NoteFlowNode = Node<NoteNodeData, 'note'>;
export type LaneFlowNode = Node<LaneNodeData, 'lane'>;
export type GroupFlowNode = Node<GroupNodeData, 'group'>;
export type FlowNode = StageFlowNode | NoteFlowNode | LaneFlowNode | GroupFlowNode;

const GROUP_COL = 1150;
const TYRE_GROUP_Y = 140;
const RIM_GROUP_Y = 1400;

interface GroupDef {
  id: string;
  label: string;
  summary: string;
  rail: FlowRail;
  x: number;
  y: number;
  stageIds: string[];
}

const GROUPS: GroupDef[] = [
  { id: 'g-tyre-intake', label: 'Mine site & sales', summary: 'Triaged at the mine, quoted, collected', rail: 'tyre', x: 40, y: TYRE_GROUP_Y, stageIds: ['triaged', 'initial_quote_sent', 'collected', 'not_repairable'] },
  { id: 'g-tyre-floor', label: 'Workshop floor', summary: 'Received, washed, inspected, cut out', rail: 'tyre', x: 40 + GROUP_COL, y: TYRE_GROUP_Y, stageIds: ['received', 'washed', 'inspected', 'cut_out', 'escalation'] },
  { id: 'g-tyre-cure', label: 'Repair & cure', summary: 'Repaired, then hot-cured in the oven', rail: 'tyre', x: 40 + GROUP_COL * 2, y: TYRE_GROUP_Y, stageIds: ['repaired', 'cooked'] },
  { id: 'g-tyre-dispatch', label: 'Quote & dispatch', summary: 'Final quote, released to the mine', rail: 'tyre', x: 40 + GROUP_COL * 3, y: TYRE_GROUP_Y, stageIds: ['final_quote_sent', 'dispatched', 'closed'] },
  { id: 'g-rim-intake', label: 'Rim intake', summary: "The mine's rim list, received, blasted", rail: 'rim', x: 40, y: RIM_GROUP_Y, stageIds: ['notified', 'rim_received', 'blasted'] },
  { id: 'g-rim-ndt', label: 'Crack testing (NDT)', summary: 'Pass → BTP · Fail → repair & re-test', rail: 'rim', x: 40 + GROUP_COL, y: RIM_GROUP_Y, stageIds: ['ndt_tested', 'btp', 'rim_repaired', 'retested'] },
  { id: 'g-rim-dispatch', label: 'Certify & dispatch', summary: 'Two certificates, released to the mine', rail: 'rim', x: 40 + GROUP_COL * 2, y: RIM_GROUP_Y, stageIds: ['certified', 'rim_dispatched', 'rim_closed'] },
];

// Position of each stage relative to its group's own (x, y).
const LOCAL_POSITION: Record<string, { x: number; y: number }> = {
  triaged: { x: 0, y: 180 },
  initial_quote_sent: { x: 260, y: 180 },
  collected: { x: 520, y: 180 },
  not_repairable: { x: 0, y: 640 },

  received: { x: 0, y: 180 },
  washed: { x: 260, y: 180 },
  inspected: { x: 520, y: 180 },
  cut_out: { x: 780, y: 180 },
  escalation: { x: 650, y: 680 },

  repaired: { x: 0, y: 180 },
  cooked: { x: 260, y: 180 },

  final_quote_sent: { x: 0, y: 180 },
  dispatched: { x: 260, y: 180 },
  closed: { x: 520, y: 180 },

  notified: { x: 0, y: 180 },
  rim_received: { x: 260, y: 180 },
  blasted: { x: 520, y: 180 },

  ndt_tested: { x: 0, y: 180 },
  btp: { x: 340, y: 20 },
  rim_repaired: { x: 340, y: 480 },
  retested: { x: 680, y: 480 },

  certified: { x: 0, y: 180 },
  rim_dispatched: { x: 260, y: 180 },
  rim_closed: { x: 520, y: 180 },
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

function stageNode(id: string, group: GroupDef, kind: StageKind = 'stage'): StageFlowNode {
  const src = (group.rail === 'tyre' ? TYRE_STAGES : RIM_STAGES).find((s) => s.id === id) ?? TYRE_TERMINAL;
  const local = LOCAL_POSITION[id] ?? { x: 0, y: 180 };
  return {
    id,
    type: 'stage',
    position: { x: group.x + local.x, y: group.y + local.y },
    data: {
      kind: src.gate ? 'gate' : kind,
      label: src.label,
      rail: group.rail,
      actor: src.actor,
      world: src.world,
      captures: src.captures,
      notify: src.notify,
      notes: NOTES[id],
      collapsed: true,
      groupId: group.id,
    },
  };
}

export function buildDefaultNodes(): FlowNode[] {
  const nodes: FlowNode[] = [];

  nodes.push({ id: 'lane-tyre', type: 'lane', position: { x: 40, y: TYRE_GROUP_Y - 92 }, data: { kind: 'lane', label: 'TYRE REPAIR RAIL — mine site to dispatch', rail: 'tyre' } });
  nodes.push({ id: 'lane-rim', type: 'lane', position: { x: 40, y: RIM_GROUP_Y - 92 }, data: { kind: 'lane', label: 'RIM REPAIR RAIL — mine site to dispatch', rail: 'rim' } });

  for (const group of GROUPS) {
    nodes.push({
      id: group.id,
      type: 'group',
      position: { x: group.x, y: group.y },
      data: {
        kind: 'group', label: group.label, rail: group.rail, summary: group.summary,
        count: group.stageIds.length,
      },
    });

    for (const stageId of group.stageIds) {
      if (stageId === 'escalation') {
        nodes.push({
          id: 'escalation',
          type: 'stage',
          position: { x: group.x + LOCAL_POSITION.escalation.x, y: group.y + LOCAL_POSITION.escalation.y },
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
            groupId: group.id,
          },
        });
      } else {
        nodes.push(stageNode(stageId, group, stageId === 'not_repairable' ? 'terminal' : 'stage'));
      }
    }
  }

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
  const backbone: Edge[] = [
    e('e-g-tyre-intake-g-tyre-floor', 'g-tyre-intake', 'g-tyre-floor', { sourceHandle: 'right', targetHandle: 'left', style: { strokeWidth: 2.5 } }),
    e('e-g-tyre-floor-g-tyre-cure', 'g-tyre-floor', 'g-tyre-cure', { sourceHandle: 'right', targetHandle: 'left', style: { strokeWidth: 2.5 } }),
    e('e-g-tyre-cure-g-tyre-dispatch', 'g-tyre-cure', 'g-tyre-dispatch', { sourceHandle: 'right', targetHandle: 'left', style: { strokeWidth: 2.5 } }),
    e('e-g-rim-intake-g-rim-ndt', 'g-rim-intake', 'g-rim-ndt', { sourceHandle: 'right', targetHandle: 'left', style: { strokeWidth: 2.5 } }),
    e('e-g-rim-ndt-g-rim-dispatch', 'g-rim-ndt', 'g-rim-dispatch', { sourceHandle: 'right', targetHandle: 'left', style: { strokeWidth: 2.5 } }),
  ];

  const contains: Edge[] = GROUPS.map((g) => e(`e-contains-${g.id}`, g.id, g.stageIds[0], {
    sourceHandle: 'bottom', targetHandle: 'top', style: { stroke: 'var(--td-line-strong)', strokeDasharray: '3 4' },
  }));

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
      sourceHandle: 'right', targetHandle: 'left', label: 'revised quote confirmed', style: { stroke: 'var(--td-hazard-deep)', strokeDasharray: '6 4' }, labelStyle: { fill: 'var(--td-hazard-deep)' },
    }),
  ];

  return [...backbone, ...contains, ...tyreEdges, ...rimChainAEdges, ...passFailEdges, ...branchEdges];
}

export function groupIds(): string[] {
  return GROUPS.map((g) => g.id);
}
