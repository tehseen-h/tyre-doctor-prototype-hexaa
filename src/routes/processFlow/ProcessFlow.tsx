import { useCallback, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ReactFlow, ReactFlowProvider, Background, Controls, MiniMap, BackgroundVariant,
  addEdge, applyNodeChanges, applyEdgeChanges, reconnectEdge, useReactFlow,
} from '@xyflow/react';
import type {
  Connection, Edge, NodeChange, EdgeChange, OnConnect, Node as RFNode, NodeMouseHandler, EdgeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { nodeTypes } from './nodeTypes';
import { EditPanel } from './EditPanel';
import type { Selection } from './EditPanel';
import {
  buildDefaultNodes, buildDefaultEdges,
} from '../../data/processFlowDefaults';
import type { FlowNode } from '../../data/processFlowDefaults';
import {
  loadSavedFlow, saveFlow, clearSavedFlow, exportFlowAsJson, exportFlowAsPng, readFlowFromFile,
} from './persistence';
import { Button } from '../../components/Button';
import { Toast, useToast } from '../../components/Toast';
import tyreDoctorLogoNavy from '../../assets/tyre-doctor-logo-navy.svg';

const saved = loadSavedFlow();

function randomId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function ResetFlowButton({ onReset }: { onReset: () => void }) {
  const [armed, setArmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const onClick = () => {
    if (!armed) {
      setArmed(true);
      timer.current = setTimeout(() => setArmed(false), 4000);
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    setArmed(false);
    onReset();
  };

  return (
    <button
      type="button"
      onClick={onClick}
      title="Discard your edits and restore the diagram this app actually runs on"
      style={{
        border: `1px solid ${armed ? 'var(--td-hazard)' : 'var(--td-line-strong)'}`,
        background: armed ? 'var(--td-hazard-tint)' : 'var(--td-paper)',
        color: armed ? 'var(--td-hazard-deep)' : 'var(--td-ink-2)',
        borderRadius: 'var(--td-r-sm)', fontSize: 13.5, fontWeight: 600, padding: '9px 13px', cursor: 'pointer', whiteSpace: 'nowrap',
      }}
    >
      {armed ? 'Tap again to reset' : 'Reset to default flow'}
    </button>
  );
}

function ProcessFlowInner() {
  const [nodes, setNodes] = useState<FlowNode[]>(saved?.nodes ?? buildDefaultNodes());
  const [edges, setEdges] = useState<Edge[]>(saved?.edges ?? buildDefaultEdges());
  const [selection, setSelection] = useState<Selection | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { screenToFlowPosition, getNodes } = useReactFlow();
  const { toast, show, dismiss } = useToast();

  const persist = useCallback((nextNodes: FlowNode[], nextEdges: Edge[]) => {
    saveFlow(nextNodes, nextEdges);
  }, []);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => {
      const next = applyNodeChanges(changes, nds) as FlowNode[];
      persist(next, edges);
      return next;
    });
  }, [edges, persist]);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((eds) => {
      const next = applyEdgeChanges(changes, eds);
      persist(nodes, next);
      return next;
    });
  }, [nodes, persist]);

  const onConnect: OnConnect = useCallback((connection: Connection) => {
    setEdges((eds) => {
      const next = addEdge({ ...connection, type: 'smoothstep' }, eds);
      persist(nodes, next);
      return next;
    });
  }, [nodes, persist]);

  const onReconnect = useCallback((oldEdge: Edge, newConnection: Connection) => {
    setEdges((eds) => {
      const next = reconnectEdge(oldEdge, newConnection, eds);
      persist(nodes, next);
      return next;
    });
  }, [nodes, persist]);

  const onNodeClick: NodeMouseHandler = useCallback((_e, node) => {
    setSelection({ type: 'node', node: node as FlowNode });
    if (node.type === 'stage') {
      setNodes((nds) => {
        const next = nds.map((n) => (n.id === node.id ? ({ ...n, data: { ...n.data, collapsed: !(n.data as { collapsed?: boolean }).collapsed } }) as FlowNode : n));
        persist(next, edges);
        return next;
      });
    }
  }, [edges, persist]);

  const onEdgeClick: EdgeMouseHandler = useCallback((_e, edge) => {
    setSelection({ type: 'edge', edge });
  }, []);

  const onPaneClick = useCallback(() => setSelection(null), []);

  const updateNode = useCallback((id: string, patch: Record<string, unknown>) => {
    setNodes((nds) => {
      const next = nds.map((n) => (n.id === id ? ({ ...n, data: { ...n.data, ...patch } } as FlowNode) : n));
      persist(next, edges);
      const updated = next.find((n) => n.id === id) ?? null;
      if (updated) setSelection({ type: 'node', node: updated });
      return next;
    });
  }, [edges, persist]);

  const updateEdge = useCallback((id: string, patch: Partial<Edge>) => {
    setEdges((eds) => {
      const next = eds.map((ed) => (ed.id === id ? { ...ed, ...patch } : ed));
      persist(nodes, next);
      const updated = next.find((ed) => ed.id === id) ?? null;
      if (updated) setSelection({ type: 'edge', edge: updated });
      return next;
    });
  }, [nodes, persist]);

  const deleteSelected = useCallback(() => {
    if (!selection) return;
    if (selection.type === 'node') {
      const id = selection.node.id;
      setNodes((nds) => {
        const next = nds.filter((n) => n.id !== id);
        setEdges((eds) => {
          const nextEdges = eds.filter((ed) => ed.source !== id && ed.target !== id);
          persist(next, nextEdges);
          return nextEdges;
        });
        return next;
      });
    } else {
      const id = selection.edge.id;
      setEdges((eds) => {
        const next = eds.filter((ed) => ed.id !== id);
        persist(nodes, next);
        return next;
      });
    }
    setSelection(null);
  }, [selection, nodes, persist]);

  const addStage = useCallback(() => {
    const id = randomId('step');
    const position = screenToFlowPosition({ x: 320, y: 220 });
    const node: FlowNode = {
      id, type: 'stage', position,
      data: { kind: 'stage', label: 'New step', rail: 'tyre', actor: '', world: 'workshop', captures: [], notify: null, notes: '', collapsed: false },
    };
    setNodes((nds) => {
      const next = [...nds, node];
      persist(next, edges);
      return next;
    });
    setSelection({ type: 'node', node });
  }, [screenToFlowPosition, edges, persist]);

  const addNote = useCallback(() => {
    const id = randomId('note');
    const position = screenToFlowPosition({ x: 320, y: 420 });
    const node: FlowNode = { id, type: 'note', position, data: { kind: 'note', label: 'Note', notes: 'Type your note here…' } };
    setNodes((nds) => {
      const next = [...nds, node];
      persist(next, edges);
      return next;
    });
    setSelection({ type: 'node', node });
  }, [screenToFlowPosition, edges, persist]);

  const setAllCollapsed = useCallback((collapsed: boolean) => {
    setNodes((nds) => {
      const next = nds.map((n) => (n.type === 'stage' ? ({ ...n, data: { ...n.data, collapsed } }) as FlowNode : n));
      persist(next, edges);
      return next;
    });
  }, [edges, persist]);

  const resetToDefault = useCallback(() => {
    clearSavedFlow();
    const defNodes = buildDefaultNodes();
    const defEdges = buildDefaultEdges();
    setNodes(defNodes);
    setEdges(defEdges);
    setSelection(null);
    show('Restored the default process flow.', false);
  }, [show]);

  const handleExportPng = useCallback(async () => {
    try {
      await exportFlowAsPng(getNodes() as FlowNode[]);
      show('Downloaded the diagram as an image.', false);
    } catch {
      show('Could not export an image — try again after the diagram finishes loading.', false);
    }
  }, [getNodes, show]);

  const handleExportJson = useCallback(() => {
    exportFlowAsJson(nodes, edges);
    show('Downloaded the diagram as a file you can re-import later.', false);
  }, [nodes, edges, show]);

  const handleImportClick = useCallback(() => fileInputRef.current?.click(), []);

  const handleImportFile = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const parsed = await readFlowFromFile(file);
      setNodes(parsed.nodes as FlowNode[]);
      setEdges(parsed.edges);
      setSelection(null);
      persist(parsed.nodes as FlowNode[], parsed.edges);
      show('Loaded that diagram.', false);
    } catch (err) {
      show(err instanceof Error ? err.message : 'Could not read that file.', false);
    }
  }, [persist, show]);

  const minimapNodeColor = useMemo(() => (node: RFNode) => {
    const data = node.data as Record<string, unknown>;
    if (data.kind === 'note') return '#e8cf6a';
    if (data.rail === 'rim') return 'var(--td-heat)';
    return 'var(--td-blue-mid)';
  }, []);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--td-ground)' }}>
      <header className="no-print" style={{ background: 'var(--td-paper)', borderBottom: '1px solid var(--td-line)', flex: '0 0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 20px', flexWrap: 'wrap' }}>
          <Link to="/console" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img src={tyreDoctorLogoNavy} alt="Tyre Doctor" style={{ height: 24, width: 'auto' }} />
          </Link>
          <div style={{ width: 1, height: 26, background: 'var(--td-line)' }} />
          <div>
            <div style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 19, lineHeight: 1.1 }}>Process flow</div>
            <div style={{ fontSize: 12.5, color: 'var(--td-ink-2)' }}>How a tyre or rim actually moves through the workshop — editable, matches the app</div>
          </div>
          <Link to="/console" style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 600, color: 'var(--td-blue)', textDecoration: 'none' }}>← Back to the console</Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 20px 12px', flexWrap: 'wrap' }}>
          <Button variant="secondary" size="md" onClick={() => setAllCollapsed(true)} style={{ padding: '9px 14px', fontSize: 13.5 }}>▸ Show high level</Button>
          <Button variant="secondary" size="md" onClick={() => setAllCollapsed(false)} style={{ padding: '9px 14px', fontSize: 13.5 }}>▾ Expand all detail</Button>
          <div style={{ width: 1, height: 22, background: 'var(--td-line)', margin: '0 4px' }} />
          <Button variant="primary" size="md" onClick={addStage} style={{ padding: '9px 14px', fontSize: 13.5, boxShadow: 'none' }}>+ Add step</Button>
          <Button variant="secondary" size="md" onClick={addNote} style={{ padding: '9px 14px', fontSize: 13.5 }}>+ Add note</Button>
          <Button
            variant="secondary"
            size="md"
            onClick={deleteSelected}
            disabled={!selection}
            style={{ padding: '9px 14px', fontSize: 13.5 }}
          >
            Delete selected
          </Button>
          <div style={{ width: 1, height: 22, background: 'var(--td-line)', margin: '0 4px' }} />
          <Button variant="secondary" size="md" onClick={handleExportPng} style={{ padding: '9px 14px', fontSize: 13.5 }}>Download as image</Button>
          <Button variant="secondary" size="md" onClick={handleExportJson} style={{ padding: '9px 14px', fontSize: 13.5 }}>Download as file</Button>
          <Button variant="secondary" size="md" onClick={handleImportClick} style={{ padding: '9px 14px', fontSize: 13.5 }}>Load a saved file</Button>
          <input ref={fileInputRef} type="file" accept="application/json" onChange={handleImportFile} style={{ display: 'none' }} />
          <div style={{ marginLeft: 'auto' }}>
            <ResetFlowButton onReset={resetToDefault} />
          </div>
        </div>
      </header>

      <div style={{ flex: '1 1 auto', display: 'flex', minHeight: 0 }}>
        <div style={{ flex: '1 1 auto', minWidth: 0 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onReconnect={onReconnect}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            deleteKeyCode={['Backspace', 'Delete']}
            fitView
            minZoom={0.15}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--td-line-strong)" />
            <Controls showInteractive={false} />
            <MiniMap nodeColor={minimapNodeColor} maskColor="rgba(233,239,244,.75)" pannable zoomable />
          </ReactFlow>
        </div>
        <EditPanel
          selection={selection}
          onUpdateNode={updateNode}
          onUpdateEdge={updateEdge}
          onDelete={deleteSelected}
          onClose={() => setSelection(null)}
        />
      </div>
      <Toast toast={toast} onUndo={dismiss} onDismiss={dismiss} />
    </div>
  );
}

export function ProcessFlow() {
  return (
    <ReactFlowProvider>
      <ProcessFlowInner />
    </ReactFlowProvider>
  );
}
