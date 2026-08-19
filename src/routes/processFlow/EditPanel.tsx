import type { CSSProperties } from 'react';
import type { Edge } from '@xyflow/react';
import type { FlowNode, FlowWorld, FlowRail } from '../../data/processFlowDefaults';
import { Button } from '../../components/Button';

const inputStyle: CSSProperties = {
  width: '100%', padding: '9px 11px', borderRadius: 'var(--td-r-sm)', border: '1px solid var(--td-line-strong)',
  fontSize: 14, fontFamily: 'var(--td-body)', background: 'var(--td-paper)', color: 'var(--td-ink)',
};
const labelStyle: CSSProperties = { display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--td-ink-2)', marginBottom: 5, marginTop: 14, textTransform: 'uppercase', letterSpacing: '.03em' };

export type Selection = { type: 'node'; node: FlowNode } | { type: 'edge'; edge: Edge };

export function EditPanel({
  selection, onUpdateNode, onUpdateEdge, onDelete, onClose,
}: {
  selection: Selection | null;
  onUpdateNode: (id: string, patch: Record<string, unknown>) => void;
  onUpdateEdge: (id: string, patch: Partial<Edge>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  if (!selection) {
    return (
      <aside style={panelStyle}>
        <div style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Nothing selected</div>
        <p style={{ fontSize: 13.5, color: 'var(--td-ink-2)', lineHeight: 1.5 }}>
          This opens as a handful of big phase cards — click one to reveal the real steps inside it.
          Click one of those steps to open or close its own detail (watch the ▸ arrow) — the same click also
          brings its fields up here to edit. Click a note or a connecting line to edit it. Drag from the dot
          on any edge of a card to draw a new connection. Drag a blank patch of canvas to add space; scroll or pinch to zoom.
        </p>
      </aside>
    );
  }

  if (selection.type === 'edge') {
    const { edge } = selection;
    return (
      <aside style={panelStyle}>
        <PanelHeader title="Connecting line" onClose={onClose} />
        <label style={labelStyle} htmlFor="edge-label">Label</label>
        <input
          id="edge-label"
          style={inputStyle}
          value={typeof edge.label === 'string' ? edge.label : ''}
          onChange={(e) => onUpdateEdge(edge.id, { label: e.target.value })}
          placeholder="e.g. pass, fail, worse than quoted"
        />
        <Button variant="fail" size="md" onClick={onDelete} style={{ marginTop: 18, width: '100%', justifyContent: 'center' }}>
          Disconnect this line
        </Button>
      </aside>
    );
  }

  const { node } = selection;
  const data = node.data as Record<string, unknown>;

  if (node.type === 'note') {
    return (
      <aside style={panelStyle}>
        <PanelHeader title="Sticky note" onClose={onClose} />
        <label style={labelStyle} htmlFor="note-text">Note text</label>
        <textarea
          id="note-text"
          style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }}
          value={typeof data.notes === 'string' ? data.notes : ''}
          onChange={(e) => onUpdateNode(node.id, { notes: e.target.value })}
        />
        <Button variant="fail" size="md" onClick={onDelete} style={{ marginTop: 18, width: '100%', justifyContent: 'center' }}>
          Delete this note
        </Button>
      </aside>
    );
  }

  if (node.type === 'group') {
    return (
      <aside style={panelStyle}>
        <PanelHeader title="Phase group" onClose={onClose} />
        <label style={labelStyle} htmlFor="group-label">Phase name</label>
        <input id="group-label" style={inputStyle} value={String(data.label ?? '')} onChange={(e) => onUpdateNode(node.id, { label: e.target.value })} />
        <label style={labelStyle} htmlFor="group-summary">One-line summary</label>
        <input id="group-summary" style={inputStyle} value={String(data.summary ?? '')} onChange={(e) => onUpdateNode(node.id, { summary: e.target.value })} />
        <p style={{ fontSize: 12.5, color: 'var(--td-ink-2)', marginTop: 14, lineHeight: 1.5 }}>
          Click this card on the canvas again to open or close the real steps inside it.
        </p>
      </aside>
    );
  }

  if (node.type === 'lane') {
    return (
      <aside style={panelStyle}>
        <PanelHeader title="Lane label" onClose={onClose} />
        <label style={labelStyle} htmlFor="lane-label">Text</label>
        <input id="lane-label" style={inputStyle} value={String(data.label ?? '')} onChange={(e) => onUpdateNode(node.id, { label: e.target.value })} />
        <label style={labelStyle} htmlFor="lane-rail">Rail this belongs to</label>
        <select id="lane-rail" style={inputStyle} value={String(data.rail ?? 'tyre')} onChange={(e) => onUpdateNode(node.id, { rail: e.target.value as FlowRail })}>
          <option value="tyre">Tyre</option>
          <option value="rim">Rim</option>
        </select>
        <Button variant="fail" size="md" onClick={onDelete} style={{ marginTop: 18, width: '100%', justifyContent: 'center' }}>
          Delete this label
        </Button>
      </aside>
    );
  }

  const captures = Array.isArray(data.captures) ? (data.captures as string[]) : [];

  return (
    <aside style={panelStyle}>
      <PanelHeader title="Process step" onClose={onClose} />

      <label style={labelStyle} htmlFor="step-label">Step name</label>
      <input id="step-label" style={inputStyle} value={String(data.label ?? '')} onChange={(e) => onUpdateNode(node.id, { label: e.target.value })} />

      <label style={labelStyle} htmlFor="step-actor">Who does it</label>
      <input id="step-actor" style={inputStyle} value={String(data.actor ?? '')} onChange={(e) => onUpdateNode(node.id, { actor: e.target.value })} />

      <label style={labelStyle} htmlFor="step-world">Where</label>
      <select
        id="step-world"
        style={inputStyle}
        value={String(data.world ?? 'workshop')}
        onChange={(e) => onUpdateNode(node.id, { world: e.target.value as FlowWorld })}
      >
        <option value="field">Mine site</option>
        <option value="workshop">Workshop</option>
        <option value="office">Office</option>
      </select>

      <label style={labelStyle} htmlFor="step-kind">Type of step</label>
      <select
        id="step-kind"
        style={inputStyle}
        value={String(data.kind ?? 'stage')}
        onChange={(e) => onUpdateNode(node.id, { kind: e.target.value })}
      >
        <option value="stage">Ordinary step</option>
        <option value="gate">Decision point (something can block it)</option>
        <option value="decision">Exception path (e.g. escalation)</option>
        <option value="terminal">End of the road (e.g. not repairable)</option>
      </select>

      <label style={labelStyle} htmlFor="step-captures">What gets recorded here (one per line)</label>
      <textarea
        id="step-captures"
        style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }}
        value={captures.join('\n')}
        onChange={(e) => onUpdateNode(node.id, { captures: e.target.value.split('\n').filter((l) => l.trim().length) })}
      />

      <label style={labelStyle} htmlFor="step-notify">Who gets told</label>
      <input
        id="step-notify"
        style={inputStyle}
        value={typeof data.notify === 'string' ? data.notify : ''}
        onChange={(e) => onUpdateNode(node.id, { notify: e.target.value })}
      />

      <label style={labelStyle} htmlFor="step-notes">Notes / source</label>
      <textarea
        id="step-notes"
        style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
        value={typeof data.notes === 'string' ? data.notes : ''}
        onChange={(e) => onUpdateNode(node.id, { notes: e.target.value })}
        placeholder="Why this step works this way, and where that came from"
      />

      <Button variant="fail" size="md" onClick={onDelete} style={{ marginTop: 18, width: '100%', justifyContent: 'center' }}>
        Delete this step
      </Button>
    </aside>
  );
}

function PanelHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
      <div style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 18 }}>{title}</div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close panel"
        style={{ border: 'none', background: 'transparent', color: 'var(--td-ink-3)', fontSize: 18, cursor: 'pointer', padding: 4 }}
      >
        ✕
      </button>
    </div>
  );
}

const panelStyle: CSSProperties = {
  width: 320, flex: '0 0 320px', background: 'var(--td-paper)', borderLeft: '1px solid var(--td-line)',
  padding: '20px 20px 40px', overflowY: 'auto', height: '100%',
};
