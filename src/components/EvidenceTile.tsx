// Defect #6 (PRD §11): evidence tiles were reading as dark icon squares, not
// captured evidence. Fixed here with real depth — a vignette ground, a lit
// subject, a beveled highlight ring so it reads as glass/lens rather than a
// flat icon, and a metadata strip burned into the bottom like a workshop photo.
import type { PhotoKind } from '../types/domain';
import {
  DamageMark, WholeTyreMark, CavityMark, RepairMark, SerialPlateMark, RejectionMark, CrackMark,
} from './Glyphs';

export interface EvidenceTileProps {
  kind: PhotoKind;
  at: string;
  by: string;
  stageLabel: string;
  where: string;
  note?: string;
  serial?: string;
  size?: string;
  make?: string;
  width?: number;
  height?: number;
  queued?: boolean;
}

const MARK_SIZE: Partial<Record<PhotoKind, number>> = {
  damage: 68, whole_tyre: 74, cavity: 68, repair: 68, rejection: 66, crack: 60,
};

function Subject(props: EvidenceTileProps) {
  switch (props.kind) {
    case 'serial_plate': return <SerialPlateMark serial={props.serial ?? '—'} size={props.size} make={props.make} />;
    case 'damage': return <DamageMark size={MARK_SIZE.damage} />;
    case 'whole_tyre': return <WholeTyreMark size={MARK_SIZE.whole_tyre} />;
    case 'cavity': return <CavityMark size={MARK_SIZE.cavity} />;
    case 'repair': return <RepairMark size={MARK_SIZE.repair} />;
    case 'rejection': return <RejectionMark size={MARK_SIZE.rejection} />;
    case 'crack': return <CrackMark size={MARK_SIZE.crack} />;
    default: return <WholeTyreMark size={70} />;
  }
}

export function EvidenceTile(props: EvidenceTileProps) {
  const { at, by, stageLabel, where, note, width = 150, height = 118, queued } = props;
  return (
    <div style={{ width }}>
      <div
        style={{
          position: 'relative', height, borderRadius: 'var(--td-r-sm)', overflow: 'hidden',
          background: 'radial-gradient(140% 110% at 28% 12%, #626c75 0%, #384049 46%, #20262a 82%, #14181b 100%)',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.16), inset 0 -22px 30px rgba(0,0,0,.35), var(--td-card)',
        }}
      >
        <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(120deg, rgba(255,255,255,.10), transparent 38%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
          <Subject {...props} />
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: 'rgba(9,13,16,.82)', padding: '5px 8px', backdropFilter: 'blur(1px)' }}>
          <div style={{ fontFamily: 'var(--td-mono)', fontSize: 10, color: '#fff', lineHeight: 1.35 }}>{at} · {by}</div>
          <div style={{ fontFamily: 'var(--td-mono)', fontSize: 10, color: 'var(--td-hazard)', lineHeight: 1.35 }}>{stageLabel} · {where}</div>
        </div>
        {queued && (
          <div style={{ position: 'absolute', top: 6, right: 6, background: 'var(--td-hazard)', color: 'var(--td-hazard-ink)', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>
            queued
          </div>
        )}
      </div>
      {note && <div style={{ fontSize: 14, color: 'var(--td-ink-2)', marginTop: 6, lineHeight: 1.35 }}>{note}</div>}
    </div>
  );
}
