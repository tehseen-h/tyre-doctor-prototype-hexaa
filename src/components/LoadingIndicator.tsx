import { TyreGlyph } from './Glyphs';

export function LoadingIndicator({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, padding: '96px 20px' }}>
      <TyreGlyph size={104} spinning />
      <div style={{ fontFamily: 'var(--td-display)', fontWeight: 600, fontSize: 26 }}>{title}</div>
      {sub && <div style={{ fontSize: 16, color: 'var(--td-ink-2)' }}>{sub}</div>}
    </div>
  );
}

export function RouteFallback() {
  return <LoadingIndicator title="Loading TD One" />;
}
