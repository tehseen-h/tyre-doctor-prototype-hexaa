import { getNodesBounds, getViewportForBounds } from '@xyflow/react';
import type { Edge } from '@xyflow/react';
import { toPng } from 'html-to-image';
import type { FlowNode } from '../../data/processFlowDefaults';

// v3: bumped because the group layout changed from a fixed wide grid to an
// accordion (collapsed groups pack tight; only an expanded one claims extra
// width) — a v1/v2 saved flow's baked-in positions would fight the new layout.
const STORAGE_KEY = 'td-one-process-flow-v3';

export interface SavedFlow {
  nodes: FlowNode[];
  edges: Edge[];
  expandedGroups?: Record<string, boolean>;
  savedAt: string;
}

export function loadSavedFlow(): SavedFlow | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveFlow(nodes: FlowNode[], edges: Edge[], expandedGroups?: Record<string, boolean>): void {
  const payload: SavedFlow = { nodes, edges, expandedGroups, savedAt: new Date().toISOString() };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function clearSavedFlow(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}

function downloadBlob(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportFlowAsJson(nodes: FlowNode[], edges: Edge[], expandedGroups?: Record<string, boolean>): void {
  const payload: SavedFlow = { nodes, edges, expandedGroups, savedAt: new Date().toISOString() };
  downloadBlob(JSON.stringify(payload, null, 2), 'td-one-process-flow.json', 'application/json');
}

export function readFlowFromFile(file: File): Promise<SavedFlow> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
          reject(new Error('That file does not look like a process-flow export.'));
          return;
        }
        resolve(parsed);
      } catch {
        reject(new Error('Could not read that file as JSON.'));
      }
    };
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.readAsText(file);
  });
}

export async function exportFlowAsPng(nodes: FlowNode[]): Promise<void> {
  const viewportEl = document.querySelector<HTMLElement>('.react-flow__viewport');
  if (!viewportEl) return;
  const bounds = getNodesBounds(nodes);
  const padding = 80;
  const width = bounds.width + padding * 2;
  const height = bounds.height + padding * 2;
  const viewport = getViewportForBounds(bounds, width, height, 0.2, 2, 0.05);

  const dataUrl = await toPng(viewportEl, {
    backgroundColor: '#e9eff4',
    width,
    height,
    pixelRatio: 1,
    skipFonts: true,
    style: {
      width: String(width),
      height: String(height),
      transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
    },
  });
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = 'td-one-process-flow.png';
  document.body.appendChild(a);
  a.click();
  a.remove();
}
