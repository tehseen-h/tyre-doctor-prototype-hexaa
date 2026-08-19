import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { StageFlowNode, NoteFlowNode, LaneFlowNode, GroupFlowNode, FlowWorld } from '../../data/processFlowDefaults';

const WORLD_STYLE: Record<FlowWorld, { bg: string; ink: string; label: string }> = {
  field: { bg: 'var(--td-hazard-tint)', ink: 'var(--td-hazard-deep)', label: 'Mine site' },
  workshop: { bg: 'var(--td-blue-tint)', ink: 'var(--td-blue-deep)', label: 'Workshop' },
  office: { bg: '#eef2f5', ink: 'var(--td-ink-2)', label: 'Office' },
};

const HANDLE_STYLE = { width: 10, height: 10, background: 'var(--td-line-strong)', border: '2px solid var(--td-paper)', zIndex: 1 };
const TARGET_CATCH_STYLE = { width: 20, height: 20, background: 'transparent', border: 'none', zIndex: 0 };

/** Every side is both a source and a target so a user can freely draw a new
 * connection from, or drop one onto, any of the four sides of any card. */
function AnyHandles() {
  const sides = [Position.Top, Position.Right, Position.Bottom, Position.Left];
  const ids = ['top', 'right', 'bottom', 'left'];
  return (
    <>
      {sides.map((pos, i) => (
        <Handle key={`t-${ids[i]}`} id={ids[i]} type="target" position={pos} style={TARGET_CATCH_STYLE} />
      ))}
      {sides.map((pos, i) => (
        <Handle key={`s-${ids[i]}`} id={ids[i]} type="source" position={pos} isConnectableStart isConnectableEnd style={HANDLE_STYLE} />
      ))}
    </>
  );
}

const KIND_CHROME: Record<string, { border: string; ring: string; dash?: string; tag?: string; tagBg?: string; tagInk?: string }> = {
  stage: { border: 'var(--td-line-strong)', ring: 'transparent' },
  gate: { border: 'var(--td-hazard)', ring: 'rgba(245,163,0,.22)', tag: 'Decision point', tagBg: 'var(--td-hazard)', tagInk: 'var(--td-hazard-ink)' },
  decision: { border: 'var(--td-hazard-deep)', ring: 'rgba(245,163,0,.18)', dash: '7 5', tag: 'Exception path', tagBg: 'var(--td-hazard-tint)', tagInk: 'var(--td-hazard-deep)' },
  terminal: { border: 'var(--td-fail)', ring: 'rgba(192,42,34,.16)', dash: '7 5', tag: 'End of the road', tagBg: 'var(--td-fail-tint)', tagInk: 'var(--td-fail-deep)' },
};

export function StageNode({ data, selected }: NodeProps<StageFlowNode>) {
  const chrome = KIND_CHROME[data.kind] ?? KIND_CHROME.stage;
  const world = data.world ? WORLD_STYLE[data.world] : null;
  const captures = data.captures ?? [];
  const shown = captures.slice(0, 3);
  const more = captures.length - shown.length;
  const collapsed = data.collapsed !== false;

  return (
    <div
      style={{
        width: 236,
        background: 'var(--td-paper)',
        border: `2px ${chrome.dash ? 'dashed' : 'solid'} ${chrome.border}`,
        borderRadius: 'var(--td-r-md)',
        boxShadow: selected ? '0 0 0 4px var(--td-blue-tint), var(--td-lift)' : `0 0 0 6px ${chrome.ring}, var(--td-card)`,
        padding: '11px 13px 12px',
        fontFamily: 'var(--td-body)',
        cursor: 'pointer',
      }}
    >
      <AnyHandles />
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <span
          aria-hidden="true"
          className="nodrag"
          style={{
            flex: 'none', width: 20, height: 20, borderRadius: '50%', display: 'grid', placeItems: 'center',
            background: 'var(--td-ground)', color: 'var(--td-ink-2)', fontSize: 11, marginTop: 1,
            transform: collapsed ? 'rotate(0deg)' : 'rotate(90deg)', transition: 'transform 160ms ease',
          }}
        >
          ▸
        </span>
        <div style={{ flex: '1 1 auto', minWidth: 0 }}>
          {chrome.tag && (
            <div style={{
              display: 'inline-block', fontSize: 10.5, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase',
              background: chrome.tagBg, color: chrome.tagInk, borderRadius: 999, padding: '2px 8px', marginBottom: 6,
            }}
            >
              {chrome.tag}
            </div>
          )}
          <div style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 17, lineHeight: 1.15 }}>{data.label}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 5 }}>
            {world && (
              <span style={{ fontSize: 11, fontWeight: 700, background: world.bg, color: world.ink, borderRadius: 999, padding: '2px 8px' }}>
                {world.label}
              </span>
            )}
            {data.actor && <span style={{ fontSize: 12.5, color: 'var(--td-ink-2)' }}>{data.actor}</span>}
          </div>
        </div>
      </div>

      {!collapsed && (
        <div style={{ marginLeft: 28 }}>
          {shown.length > 0 && (
            <ul style={{ margin: '9px 0 0', padding: '0 0 0 16px', fontSize: 12, color: 'var(--td-ink-2)', lineHeight: 1.5 }}>
              {shown.map((c) => <li key={c}>{c}</li>)}
              {more > 0 && <li style={{ color: 'var(--td-ink-3)', fontStyle: 'italic' }}>+{more} more</li>}
            </ul>
          )}
          {data.notify && (
            <div style={{ marginTop: 8, fontSize: 11.5, color: 'var(--td-ink-3)' }}>
              <strong style={{ color: 'var(--td-ink-2)' }}>Who gets told: </strong>{data.notify}
            </div>
          )}
          {data.notes && (
            <div style={{
              marginTop: 9, fontSize: 11.5, color: 'var(--td-blue-deep)', display: 'flex', gap: 5, alignItems: 'flex-start',
              background: 'var(--td-blue-tint)', borderRadius: 8, padding: '6px 8px',
            }}
            >
              <span aria-hidden="true">ℹ</span>
              <span>{data.notes}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function NoteNode({ data, selected }: NodeProps<NoteFlowNode>) {
  return (
    <div
      style={{
        width: 200, minHeight: 90, background: '#fff6d8', border: '2px solid #e8cf6a',
        borderRadius: 'var(--td-r-sm)', padding: '11px 13px', boxShadow: selected ? '0 0 0 4px var(--td-blue-tint)' : '0 6px 16px rgba(139,110,0,.16)',
        transform: 'rotate(-0.6deg)', fontFamily: 'var(--td-body)',
      }}
    >
      <AnyHandles />
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.05em', textTransform: 'uppercase', color: '#8a6d00', marginBottom: 5 }}>Note</div>
      <div style={{ fontSize: 13.5, color: '#3d3110', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>{data.notes || data.label}</div>
    </div>
  );
}

const RAIL_STYLE: Record<'tyre' | 'rim', { border: string; tint: string; ink: string }> = {
  tyre: { border: 'var(--td-blue)', tint: 'var(--td-blue-tint)', ink: 'var(--td-blue-deep)' },
  rim: { border: 'var(--td-heat)', tint: '#fbe9e3', ink: 'var(--td-heat-deep)' },
};

export function GroupNode({ data, selected }: NodeProps<GroupFlowNode>) {
  const rail = RAIL_STYLE[data.rail];
  const expanded = Boolean(data.expanded);
  return (
    <div
      style={{
        width: 260,
        background: expanded ? rail.tint : 'var(--td-paper)',
        border: `3px solid ${rail.border}`,
        borderRadius: 'var(--td-r-lg)',
        boxShadow: selected ? '0 0 0 4px var(--td-blue-tint), var(--td-lift)' : 'var(--td-lift)',
        padding: '16px 18px 17px',
        fontFamily: 'var(--td-body)',
        cursor: 'pointer',
      }}
    >
      <Handle id="left" type="target" position={Position.Left} style={TARGET_CATCH_STYLE} />
      <Handle id="left" type="source" position={Position.Left} isConnectableStart isConnectableEnd style={HANDLE_STYLE} />
      <Handle id="right" type="target" position={Position.Right} style={TARGET_CATCH_STYLE} />
      <Handle id="right" type="source" position={Position.Right} isConnectableStart isConnectableEnd style={HANDLE_STYLE} />
      <Handle id="bottom" type="target" position={Position.Bottom} style={TARGET_CATCH_STYLE} />
      <Handle id="bottom" type="source" position={Position.Bottom} isConnectableStart isConnectableEnd style={HANDLE_STYLE} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <span
          aria-hidden="true"
          style={{
            flex: 'none', width: 24, height: 24, borderRadius: '50%', display: 'grid', placeItems: 'center',
            background: rail.border, color: '#fff', fontSize: 12, fontWeight: 700,
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 160ms ease',
          }}
        >
          ▸
        </span>
        <div style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 20, lineHeight: 1.1, color: rail.ink }}>{data.label}</div>
      </div>
      <p style={{ margin: '9px 0 0', fontSize: 12.5, color: 'var(--td-ink-2)', lineHeight: 1.4 }}>{data.summary}</p>
      <div style={{
        display: 'inline-block', marginTop: 9, fontSize: 10.5, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase',
        color: rail.ink, background: '#fff', border: `1px solid ${rail.border}`, borderRadius: 999, padding: '2px 9px',
      }}
      >
        {data.count} step{data.count === 1 ? '' : 's'} · {expanded ? 'click to collapse' : 'click to expand'}
      </div>
    </div>
  );
}

export function LaneNode({ data }: NodeProps<LaneFlowNode>) {
  return (
    <div style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 15, letterSpacing: '.06em', textTransform: 'uppercase', color: data.rail === 'tyre' ? 'var(--td-blue-deep)' : 'var(--td-heat-deep)', whiteSpace: 'nowrap' }}>
      {data.label}
    </div>
  );
}

export const nodeTypes = { stage: StageNode, note: NoteNode, lane: LaneNode, group: GroupNode };
