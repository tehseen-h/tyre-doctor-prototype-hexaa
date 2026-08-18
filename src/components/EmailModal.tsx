import type { ReactNode } from 'react';
import type { EmailPreview } from '../types/domain';
import { Button } from './Button';

export function EmailModal({ email, onClose, footer }: { email: EmailPreview; onClose: () => void; footer?: ReactNode }) {
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(17,28,36,.58)', display: 'grid', placeItems: 'center', padding: 30 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="What sales gets told"
        style={{ background: 'var(--td-paper)', maxWidth: 680, width: '100%', borderRadius: 'var(--td-r-lg)', boxShadow: 'var(--td-lift)', overflow: 'hidden', animation: 'tdRise 220ms ease-out both' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 22px', borderBottom: '1px solid var(--td-line)', background: 'var(--td-ground-soft)' }}>
          <span style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 23 }}>What sales gets told</span>
          <Button variant="secondary" onClick={onClose} style={{ marginLeft: 'auto', padding: '9px 16px', fontSize: 16 }}>Close</Button>
        </div>
        <div style={{ padding: 22 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '76px 1fr', gap: '9px 14px', fontSize: 16, marginBottom: 18 }}>
            <span style={{ color: 'var(--td-ink-3)' }}>To</span><span style={{ fontFamily: 'var(--td-mono)', fontSize: 15 }}>{email.to}</span>
            <span style={{ color: 'var(--td-ink-3)' }}>From</span><span style={{ fontFamily: 'var(--td-mono)', fontSize: 15 }}>{email.from}</span>
            <span style={{ color: 'var(--td-ink-3)' }}>Subject</span><span style={{ fontWeight: 600 }}>{email.subject}</span>
          </div>
          <div style={{ borderTop: '1px solid var(--td-line)', paddingTop: 18, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 16, lineHeight: 1.5 }}>
            {email.lines.map((line) => <div key={line}>{line}</div>)}
          </div>
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--td-line)', fontSize: 15, color: 'var(--td-ink-3)' }}>
            {footer ?? 'Sent when the stage is confirmed. Quoting stays in NetSuite — TD One holds the quote number and its status.'}
          </div>
        </div>
      </div>
    </div>
  );
}
