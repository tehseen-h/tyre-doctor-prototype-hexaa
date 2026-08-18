// "Needs a person" — DESIGN.md: used in exactly two places, the escalation and
// the held rim rows. The hazard-tape treatment appears nowhere else.
import type { ReactNode } from 'react';

export function HazardHeader({ label, right }: { label: string; right?: ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '11px 20px', flexWrap: 'wrap',
      background: 'repeating-linear-gradient(135deg,var(--td-hazard) 0 16px,#1b1a17 16px 32px)',
    }}
    >
      <span style={{
        background: '#1b1a17', color: 'var(--td-hazard)', fontFamily: 'var(--td-display)', fontWeight: 700,
        fontSize: 19, letterSpacing: '.06em', textTransform: 'uppercase', padding: '4px 12px', borderRadius: 6, whiteSpace: 'nowrap',
      }}
      >
        Needs a person
      </span>
      <span style={{ background: 'var(--td-hazard-ink)', color: '#fff', fontSize: 15, fontWeight: 600, padding: '5px 12px', borderRadius: 6, whiteSpace: 'nowrap' }}>
        {label}
      </span>
      {right && <div style={{ marginLeft: 'auto' }}>{right}</div>}
    </div>
  );
}

export function HazardBand({ label, right, children }: { label: string; right?: ReactNode; children: ReactNode }) {
  return (
    <div style={{ borderRadius: 'var(--td-r-lg)', overflow: 'hidden', border: '2px solid var(--td-hazard)', boxShadow: 'var(--td-card)', background: 'var(--td-paper)' }}>
      <HazardHeader label={label} right={right} />
      {children}
    </div>
  );
}
