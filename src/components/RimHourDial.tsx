// PRD §11 defect #7: the arc must visibly encode hours against the 10,000 h
// interval — "At interval" was reading as a full closed ring, so the fill
// encoded nothing. Fixed: the inner arc always leaves a visible gap up to
// 10,000 h, and overdue rims get a full ring PLUS a distinct dashed outer
// ring so "overshot" reads differently from "reached".
export function RimHourDial({ hours, assetNo, dialSize = 92 }: { hours: number; assetNo: string; dialSize?: number }) {
  const overdue = hours > 12000;
  const early = hours < 9000;
  const status = overdue ? 'Overdue' : early ? 'Back early' : 'At interval';
  const color = overdue ? 'var(--td-fail)' : early ? 'var(--td-blue)' : 'var(--td-pass)';
  const r = 33;
  const c = 2 * Math.PI * r;
  const fraction = overdue ? 1 : Math.min(hours / 10000, 0.94);
  const dash = `${(c * fraction).toFixed(1)} ${c.toFixed(1)}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <svg viewBox="0 0 84 84" width={dialSize} height={dialSize} style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
        <circle cx={42} cy={42} r={r} fill="none" stroke="#e2e8ed" strokeWidth={10} />
        {overdue && (
          <circle cx={42} cy={42} r={r + 6} fill="none" stroke="var(--td-fail)" strokeWidth={2.5} strokeDasharray="3 5" opacity={0.9} />
        )}
        <circle cx={42} cy={42} r={r} fill="none" stroke={color} strokeWidth={10} strokeLinecap="round" strokeDasharray={dash} />
      </svg>
      <div style={{ fontFamily: 'var(--td-mono)', fontSize: 15, fontWeight: 600 }}>{assetNo}</div>
      <div style={{ fontFamily: 'var(--td-mono)', fontSize: 14, color: 'var(--td-ink-2)', fontVariantNumeric: 'tabular-nums' }}>{hours.toLocaleString()} h</div>
      <div style={{ fontSize: 14, fontWeight: 700, color, whiteSpace: 'nowrap' }}>{status}{overdue ? ` · +${(hours - 10000).toLocaleString()} h` : ''}</div>
    </div>
  );
}
