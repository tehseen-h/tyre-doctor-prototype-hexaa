import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useBranchReports } from '../data/useStore';
import { BRANCHES } from '../data/fixtures';
import { RULES } from '../config/rules';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useTour, TourOverlay } from '../components/Tour';
import { HeaderSlot } from '../layout/HeaderSlot';
import type { BranchCode } from '../types/domain';

const PERIODS = ['This month', 'Quarter', 'Year'] as const;
const PERIOD_MULT: Record<(typeof PERIODS)[number], number> = { 'This month': 1, Quarter: 3, Year: 12 };
const STAGE_LABEL: Record<string, string> = {
  received: 'Received', washed: 'Washed', inspected: 'Inspected', cut_out: 'Cut out', repaired: 'Repaired', cooked: 'Cooked',
};

export function BranchPerformance() {
  const reports = useBranchReports();
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>('This month');
  const [drill, setDrill] = useState<BranchCode>('MKY');
  const [hoursOpen, setHoursOpen] = useState(false);
  const [manHoursEntry, setManHoursEntry] = useState('1200');
  const [hoursSaved, setHoursSaved] = useState(false);

  const tour = useTour([
    { ref: 'mix', text: 'Intermediates and majors, per branch — the split the superintendent builds by hand today.' },
    { ref: 'hours', text: 'Man hours against repair hours. Hours are typed in here, because nobody captures labour digitally yet.' },
  ]);

  const headerMiddle = <Link to="/console" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--td-steel-ink)', background: 'rgba(234,243,248,.12)', borderRadius: 'var(--td-r-sm)', padding: '8px 14px', fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>← Mackay floor</Link>;
  const headerRight = <Button variant="steel-ghost" onClick={() => { setHoursOpen(true); tour.start(); }}>Show me around</Button>;

  const mult = PERIOD_MULT[period];
  const scaled = useMemo(() => reports.map((r) => {
    const manHours = r.branch === 'MKY' && hoursSaved ? Number(manHoursEntry) || 0 : r.manHours * mult;
    return { ...r, minors: r.minors * mult, intermediates: r.intermediates * mult, majors: r.majors * mult, jobsClosed: r.jobsClosed * mult, manHours, repairHours: r.repairHours * mult };
  }), [reports, mult, hoursSaved, manHoursEntry]);

  const NAMES = Object.fromEntries(BRANCHES.map((b) => [b.code, b.name]));
  const totalRepairs = scaled.reduce((a, r) => a + r.minors + r.intermediates + r.majors, 0);
  const totalMan = scaled.reduce((a, r) => a + r.manHours, 0);
  const totalRepairHours = scaled.reduce((a, r) => a + r.repairHours, 0);
  const totalMajors = scaled.reduce((a, r) => a + r.majors, 0);
  const rejects = reports.find((r) => r.branch === 'MKY')!;

  const drillReport = scaled.find((r) => r.branch === drill) ?? scaled[0];
  const stageEntries = Object.entries(drillReport.avgStageHours);
  const maxStage = Math.max(1, ...stageEntries.map(([, v]) => v));
  const maxMan = Math.max(1, ...scaled.filter((r) => r.manHours > 0).map((r) => r.manHours));

  return (
    <main style={{ maxWidth: 1520, margin: '0 auto', padding: '24px 24px 90px' }}>
      <HeaderSlot middle={headerMiddle} right={headerRight} />
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 26, flexWrap: 'wrap', marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--td-ink-3)', marginBottom: 5 }}>All eight branches</div>
          <h1 style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 44, lineHeight: 1, margin: 0 }}>Branch performance</h1>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          {PERIODS.map((p) => (
            <Button key={p} variant={period === p ? 'primary' : 'secondary'} onClick={() => setPeriod(p)}>{p}</Button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 18 }}>
        <Headline value={String(totalRepairs)} label="Repairs in period" sub="across seven workshops" />
        <Headline value={String(totalMajors)} label="Majors" sub="the ones that tie up a bay" color="var(--td-blue-deep)" />
        <Headline value={`${Math.round((totalRepairHours / (totalMan || 1)) * 100)}%`} label="Hours booked to repairs" sub={`${totalRepairHours.toLocaleString()} h of ${totalMan.toLocaleString()} h paid`} color="var(--td-blue-deep)" />
        <Headline value={`${Math.round(rejects.rejectionRate * 100)}%`} label="Rejection rate" sub="tyres found not repairable" color="var(--td-fail-deep)" />
      </div>

      <div ref={tour.setRef('mix')}>
        <Card style={{ padding: '22px 24px', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
            <h2 style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 28, margin: 0 }}>Repair mix by branch</h2>
            <span style={{ fontSize: 16, color: 'var(--td-ink-2)' }}>click a branch to drill in</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 18, fontSize: 15 }}>
              <Legend color="var(--td-blue-pale)" label="Minor" />
              <Legend color="var(--td-blue-mid)" label="Intermediate" />
              <Legend color="var(--td-blue-deep)" label="Major" />
              <span title={RULES.categoryNamesSource} style={{ background: 'var(--td-blue-tint)', color: 'var(--td-blue-deep)', borderRadius: 999, padding: '4px 12px', fontWeight: 600, cursor: 'help' }}>Where these come from</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {scaled.map((r) => {
              const total = r.minors + r.intermediates + r.majors || 1;
              return (
                <button
                  key={r.branch}
                  type="button"
                  onClick={() => setDrill(r.branch)}
                  style={{
                    display: 'grid', gridTemplateColumns: '150px 1fr 130px', gap: 16, alignItems: 'center',
                    background: drill === r.branch ? 'var(--td-blue-tint)' : 'var(--td-paper)', border: `1px solid ${drill === r.branch ? 'var(--td-blue)' : 'var(--td-line)'}`,
                    borderRadius: 'var(--td-r-md)', padding: '11px 14px', cursor: 'pointer', textAlign: 'left', width: '100%',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'baseline', gap: 9 }}>
                    <span style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 20 }}>{NAMES[r.branch]}</span>
                    <span style={{ fontFamily: 'var(--td-mono)', fontSize: 13, color: 'var(--td-ink-3)' }}>{r.branch}</span>
                  </span>
                  <span style={{ display: 'flex', height: 26, width: '100%', borderRadius: 6, overflow: 'hidden', background: 'var(--td-ground)' }}>
                    <span style={{ background: 'var(--td-blue-pale)', width: `${(r.minors / total) * 100}%`, display: 'block' }} />
                    <span style={{ background: 'var(--td-blue-mid)', width: `${(r.intermediates / total) * 100}%`, display: 'block' }} />
                    <span style={{ background: 'var(--td-blue-deep)', width: `${(r.majors / total) * 100}%`, display: 'block' }} />
                  </span>
                  <span style={{ fontFamily: 'var(--td-mono)', fontSize: 15, color: 'var(--td-ink-2)', textAlign: 'right' }}>{r.minors} · {r.intermediates} · {r.majors}</span>
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18, alignItems: 'start' }}>
        <div ref={tour.setRef('hours')}>
          <Card style={{ padding: '22px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 4, flexWrap: 'wrap' }}>
              <h2 style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 28, margin: 0 }}>Man hours against repair hours</h2>
              <Button variant="secondary" style={{ marginLeft: 'auto' }} onClick={() => setHoursOpen((v) => !v)}>{hoursOpen ? 'Hide hours entry' : 'Open man-hours entry'}</Button>
            </div>
            <div style={{ fontSize: 16, color: 'var(--td-ink-2)', marginBottom: 20 }}>Hours paid on the floor, against the hours booked to repairs.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {scaled.filter((r) => r.manHours > 0).slice(0, 5).map((r) => {
                const booked = Math.round((r.repairHours / (r.manHours || 1)) * 100);
                return (
                  <div key={r.branch}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 11, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 19 }}>{NAMES[r.branch]}</span>
                      <span style={{ fontFamily: 'var(--td-mono)', fontSize: 15, color: 'var(--td-ink-2)' }}>{r.manHours.toLocaleString()} h paid · {r.repairHours.toLocaleString()} h on repairs</span>
                      <span style={{ marginLeft: 'auto', background: booked < 55 ? 'var(--td-fail-tint)' : 'var(--td-pass-tint)', color: booked < 55 ? 'var(--td-fail-deep)' : 'var(--td-pass-deep)', borderRadius: 999, padding: '3px 12px', fontFamily: 'var(--td-mono)', fontSize: 15, fontWeight: 600 }}>{booked}% booked</span>
                    </div>
                    <div style={{ position: 'relative', height: 24, borderRadius: 6, background: 'var(--td-ground)', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(r.manHours / maxMan) * 100}%`, background: 'var(--td-blue-pale)' }} />
                      <div style={{ position: 'absolute', left: 0, top: 5, bottom: 5, width: `${(r.repairHours / maxMan) * 100}%`, background: 'var(--td-blue)', borderRadius: '0 4px 4px 0' }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {hoursOpen && (
              <div style={{ marginTop: 22, border: '1px solid rgba(13,100,173,.35)', borderRadius: 'var(--td-r-md)', background: 'var(--td-blue-tint)', padding: 20, animation: 'tdRise 260ms ease-out both' }}>
                <div style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 23, marginBottom: 4 }}>Enter man hours</div>
                <p style={{ fontSize: 16, color: 'var(--td-ink-2)', margin: '0 0 16px' }}>Labour isn&rsquo;t captured digitally anywhere yet, so it is typed in here, per branch, per period. Repair hours come from the stage timestamps.</p>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <label>
                    <span style={{ display: 'block', fontSize: 15, fontWeight: 600, color: 'var(--td-ink-2)', marginBottom: 6 }}>Branch</span>
                    <select style={{ border: '1px solid var(--td-line-strong)', borderRadius: 'var(--td-r-sm)', background: 'var(--td-paper)', fontSize: 16, padding: '11px 12px', minWidth: 186 }}>
                      <option>Mackay — MKY</option>
                    </select>
                  </label>
                  <label>
                    <span style={{ display: 'block', fontSize: 15, fontWeight: 600, color: 'var(--td-ink-2)', marginBottom: 6 }}>Man hours this period</span>
                    <input
                      value={manHoursEntry}
                      onChange={(e) => { setManHoursEntry(e.target.value.replace(/[^0-9]/g, '')); setHoursSaved(false); }}
                      style={{ border: '1px solid var(--td-line-strong)', borderRadius: 'var(--td-r-sm)', background: 'var(--td-paper)', fontFamily: 'var(--td-mono)', fontSize: 19, padding: '11px 12px', width: 146 }}
                    />
                  </label>
                  <Button variant="primary" onClick={() => setHoursSaved(true)}>Save hours</Button>
                </div>
                {hoursSaved && <div style={{ marginTop: 14, fontSize: 16, fontWeight: 600, color: 'var(--td-pass-deep)' }}>Saved against Mackay for this period. The ratio above has updated.</div>}
              </div>
            )}
          </Card>
        </div>

        <Card style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
            <h2 style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 28, margin: 0 }}>Average time in each stage</h2>
            <span style={{ background: 'var(--td-blue-tint)', color: 'var(--td-blue-deep)', borderRadius: 999, padding: '4px 13px', fontSize: 15, fontWeight: 600 }}>{NAMES[drill]}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {stageEntries.map(([k, v]) => (
              <div key={k} style={{ display: 'grid', gridTemplateColumns: '130px 1fr 70px', gap: 14, alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--td-display)', fontWeight: 600, fontSize: 19 }}>{STAGE_LABEL[k] ?? k}</span>
                <span style={{ height: 20, borderRadius: 5, background: 'var(--td-ground)', display: 'block', overflow: 'hidden' }}>
                  <span style={{ display: 'block', height: 20, borderRadius: 5, background: k === 'cooked' ? 'var(--td-heat)' : 'var(--td-blue)', width: `${(v / maxStage) * 100}%` }} />
                </span>
                <span style={{ fontFamily: 'var(--td-mono)', fontSize: 16, textAlign: 'right' }}>{v} h</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--td-line)', display: 'flex', gap: 28, flexWrap: 'wrap' }}>
            <Stat value={drillReport.jobsClosed} label="jobs closed" />
            <Stat value={`${Math.round(drillReport.rejectionRate * 100)}%`} label="rejection rate" />
            <Stat value={drillReport.minors + drillReport.intermediates + drillReport.majors} label="repairs in period" />
            <div style={{ flex: 1, minWidth: 190, fontSize: 15, color: 'var(--td-ink-2)', alignSelf: 'center' }}>The longest stage is where the floor loses days, not the cook.</div>
          </div>
        </Card>
      </div>

      <Card style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, padding: '18px 22px', borderBottom: '1px solid var(--td-line)', flexWrap: 'wrap' }}>
          <h2 style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 28, margin: 0 }}>Every branch, this period</h2>
          <span style={{ fontSize: 16, color: 'var(--td-ink-2)' }}>click a row to drill into its stage times</span>
        </div>
        <table style={{ width: '100%', fontSize: 16, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--td-ground-soft)' }}>
              {['Branch', 'Minor', 'Intermediate', 'Major', 'Closed', 'Man hours', 'Repair hours', 'Booked', 'Rejected'].map((h) => (
                <th key={h} style={{ textAlign: h === 'Branch' ? 'left' : 'right', padding: '12px 14px', borderBottom: '2px solid var(--td-line-strong)', width: h === 'Branch' ? 186 : undefined }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {scaled.map((r) => {
              const booked = r.manHours ? Math.round((r.repairHours / r.manHours) * 100) : 0;
              return (
                <tr key={r.branch} onClick={() => setDrill(r.branch)} style={{ cursor: 'pointer', background: drill === r.branch ? 'var(--td-blue-tint)' : 'transparent' }}>
                  <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--td-line)' }}><span style={{ fontWeight: 600 }}>{NAMES[r.branch]}</span> <span style={{ fontFamily: 'var(--td-mono)', fontSize: 14, color: 'var(--td-ink-3)' }}>{r.branch}</span></td>
                  <TdNum>{r.minors}</TdNum><TdNum>{r.intermediates}</TdNum><TdNum>{r.majors}</TdNum><TdNum>{r.jobsClosed}</TdNum>
                  <TdNum>{r.manHours.toLocaleString()}</TdNum><TdNum>{r.repairHours.toLocaleString()}</TdNum>
                  <TdNum color={r.manHours && booked < 55 ? 'var(--td-fail-deep)' : undefined} bold>{r.manHours ? `${booked}%` : '—'}</TdNum>
                  <TdNum>{Math.round(r.rejectionRate * 100)}%</TdNum>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ padding: '16px 22px', fontSize: 15, color: 'var(--td-ink-2)', background: 'var(--td-ground-soft)' }}>
          Leeton is head office — no workshop jobs this period. Booked is repair hours as a share of the man hours entered.
        </div>
      </Card>

      {tour.active && <TourOverlay step={tour.step} rect={tour.rect} total={tour.total} text={tour.text} onNext={tour.next} onEnd={tour.end} />}
    </main>
  );
}

function Headline({
  value, label, sub, color,
}: { value: string; label: string; sub: string; color?: string }) {
  return (
    <Card variant="reduced" style={{ padding: '26px 20px 20px' }}>
      <div style={{ fontFamily: 'var(--td-mono)', fontSize: 40, fontWeight: 600, lineHeight: 1, color: color ?? 'var(--td-ink)' }}>{value}</div>
      <div style={{ fontSize: 16, fontWeight: 600, marginTop: 8 }}>{label}</div>
      <div style={{ fontSize: 15, color: 'var(--td-ink-2)', marginTop: 2 }}>{sub}</div>
    </Card>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 14, height: 14, borderRadius: 4, background: color }} />{label}
    </span>
  );
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--td-mono)', fontSize: 26, fontWeight: 600 }}>{value}</div>
      <div style={{ fontSize: 15, color: 'var(--td-ink-2)' }}>{label}</div>
    </div>
  );
}

function TdNum({ children, color, bold }: { children: React.ReactNode; color?: string; bold?: boolean }) {
  return <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--td-line)', textAlign: 'right', fontFamily: 'var(--td-mono)', color, fontWeight: bold ? 600 : 400 }}>{children}</td>;
}
