// Drawn OTR tyre and rim glyphs — DESIGN.md: "a drawn OTR tyre: dark carcass, a
// dashed lug ring for tread blocks, a sidewall step, a steel hub and a centre
// bore" and "rims are a separate glyph: concentric steel rings with three bolt
// dots, no rubber." No stock imagery, no gradients that read as a broken image.
import type { CSSProperties } from 'react';

export function TyreGlyph({ size = 42, hot = false, spinning = false, style }: { size?: number; hot?: boolean; spinning?: boolean; style?: CSSProperties }) {
  const carcass = hot ? '#1b1416' : '#23282b';
  const lug = hot ? '#3a2420' : '#4a5359';
  const step = hot ? '#4a2c24' : '#3d4449';
  const hub = hot ? '#d2542c' : '#9aa6ad';
  const bore = hot ? '#f6c1a6' : '#6d7a82';
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-hidden="true"
      style={{ flex: 'none', animation: spinning ? 'tdRoll 1.15s linear infinite' : undefined, filter: hot ? 'drop-shadow(0 0 9px rgba(210,84,44,.85))' : undefined, ...style }}
    >
      <circle cx={50} cy={50} r={45} fill={carcass} />
      <circle cx={50} cy={50} r={36} fill="none" stroke={lug} strokeWidth={16} strokeDasharray="11 8" />
      <circle cx={50} cy={50} r={26} fill={step} />
      <circle cx={50} cy={50} r={21} fill={hub} />
      <circle cx={50} cy={50} r={7} fill={bore} />
    </svg>
  );
}

export function RimGlyph({ size = 40, style }: { size?: number; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" style={{ flex: 'none', ...style }}>
      <circle cx={50} cy={50} r={43} fill="none" stroke="#9aa6ad" strokeWidth={7} />
      <circle cx={50} cy={50} r={30} fill="none" stroke="#b8c2c8" strokeWidth={4} />
      <circle cx={50} cy={50} r={14} fill="none" stroke="#8b979e" strokeWidth={4} />
      <circle cx={50} cy={24} r={3.4} fill="#8b979e" />
      <circle cx={72} cy={62} r={3.4} fill="#8b979e" />
      <circle cx={28} cy={62} r={3.4} fill="#8b979e" />
    </svg>
  );
}

/** A cut/damage mark, drawn as a diagonal gouge — used inside evidence tiles. */
export function DamageMark({ size = 88 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <circle cx={50} cy={50} r={45} fill="#191d20" />
      <circle cx={50} cy={50} r={36} fill="none" stroke="#404a50" strokeWidth={16} strokeDasharray="11 8" />
      <circle cx={50} cy={50} r={26} fill="#343c41" />
      <path d="M26 64 L49 38" stroke="#e3623a" strokeWidth={7} strokeLinecap="round" />
      <path d="M26 64 L49 38" stroke="#ffbf9f" strokeWidth={2.4} strokeLinecap="round" />
    </svg>
  );
}

export function WholeTyreMark({ size = 92 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <ellipse cx={50} cy={92} rx={34} ry={5} fill="rgba(0,0,0,.45)" />
      <circle cx={50} cy={48} r={42} fill="#1c2124" />
      <circle cx={50} cy={48} r={34} fill="none" stroke="#454f56" strokeWidth={15} strokeDasharray="11 8" />
      <circle cx={50} cy={48} r={24} fill="#3a4247" />
      <circle cx={50} cy={48} r={19} fill="#96a1a8" />
      <circle cx={50} cy={48} r={6} fill="#6c7880" />
    </svg>
  );
}

export function CavityMark({ size = 88 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <circle cx={50} cy={50} r={45} fill="#191d20" />
      <circle cx={50} cy={50} r={36} fill="none" stroke="#404a50" strokeWidth={16} strokeDasharray="11 8" />
      <path d="M34 42 q16 -9 32 0 l-4 20 q-12 6 -24 0 z" fill="#5a4034" stroke="#c99a6a" strokeWidth={2} />
      <path d="M40 48 h20" stroke="#e0b183" strokeWidth={2} />
    </svg>
  );
}

export function RepairMark({ size = 88 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <circle cx={50} cy={50} r={45} fill="#191d20" />
      <circle cx={50} cy={50} r={36} fill="none" stroke="#404a50" strokeWidth={16} strokeDasharray="11 8" />
      <rect x={33} y={40} width={34} height={22} rx={5} fill="#25503a" stroke="#4fae7c" strokeWidth={2} />
      <path d="M40 51 l5 5 l11 -12" stroke="#8fe0b3" strokeWidth={3} fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function SerialPlateMark({ serial, size, make }: { serial: string; size?: string; make?: string }) {
  return (
    <div style={{
      border: '2px solid #cdd4d9', borderRadius: 4, padding: '7px 10px',
      background: 'linear-gradient(150deg,#7d868d,#5b6469)', boxShadow: '0 3px 10px rgba(0,0,0,.45)',
    }}
    >
      <div style={{ fontFamily: 'var(--td-mono)', fontSize: 13, color: '#fff', letterSpacing: '.04em' }}>{serial}</div>
      {(size || make) && (
        <div style={{ fontFamily: 'var(--td-mono)', fontSize: 9, color: '#dbe1e5', marginTop: 2 }}>
          {[size, make?.toUpperCase()].filter(Boolean).join(' · ')}
        </div>
      )}
    </div>
  );
}

export function RejectionMark({ size = 84 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <circle cx={50} cy={50} r={45} fill="#191d20" />
      <circle cx={50} cy={50} r={36} fill="none" stroke="#404a50" strokeWidth={16} strokeDasharray="11 8" />
      <path d="M24 58 L52 34" stroke="#e3623a" strokeWidth={8} strokeLinecap="round" />
      <path d="M24 58 L52 34" stroke="#ffbf9f" strokeWidth={2.6} strokeLinecap="round" />
    </svg>
  );
}

export function CrackMark({ size = 88 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <circle cx={50} cy={50} r={45} fill="#191d20" />
      <circle cx={50} cy={50} r={36} fill="none" stroke="#404a50" strokeWidth={16} strokeDasharray="11 8" />
      <path d="M28 66 L44 46 L38 40 L58 24" stroke="#e3623a" strokeWidth={4} fill="none" strokeLinecap="round" />
    </svg>
  );
}
