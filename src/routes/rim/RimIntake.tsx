import {
  useEffect, useRef, useState,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useIntakeState, intakeState } from '../../data/intakeState';
import { parseRimReturnsWorkbook, parseManualRows } from '../../data/xlsxIntake';
import { store } from '../../data/store';
import { CUSTOMERS } from '../../data/fixtures';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { HazardHeader } from '../../components/HazardBand';
import { useTour, TourOverlay } from '../../components/Tour';
import { HeaderSlot } from '../../layout/HeaderSlot';
import { useRevealAnnouncer } from '../../components/useRevealAnnouncer';
import { RimTabs } from './RimTabs';
import type { IntakeRow } from '../../types/domain';

type ManualRow = { customerAssetNo: string; rimSerial: string; size: string; fleetNo: string; hours: string; removedOn: string };
const BLANK_MANUAL: ManualRow = {
  customerAssetNo: '', rimSerial: '', size: '', fleetNo: '', hours: '', removedOn: '',
};

export function RimIntake() {
  const intake = useIntakeState();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(2); // starts at the reviewed state already on the console (defect #8: same numbers everywhere)
  const [mode, setMode] = useState<'upload' | 'manual'>('upload');
  const [uploadState, setUploadState] = useState<'idle' | 'running'>('idle');
  const [uploadPct, setUploadPct] = useState(0);
  const [manualRows, setManualRows] = useState<ManualRow[]>([{ ...BLANK_MANUAL }, { ...BLANK_MANUAL }, { ...BLANK_MANUAL }]);
  const [justCreated, setJustCreated] = useState({ created: 0, held: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const reviewRef = useRef<HTMLDivElement | null>(null);
  const { reveal, liveRegion } = useRevealAnnouncer();

  const tour = useTour([
    { ref: 'held', text: 'Five rows out of eighteen could not be trusted. They are held here, in plain English.' },
    { ref: 'stepper', text: 'Upload, review, create — and the step you are on is always the one lit up.' },
  ]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') tour.end(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const runUpload = (fileName: string, run: () => Promise<IntakeRow[] | void>) => {
    setUploadState('running');
    setUploadPct(0);
    setStep(1);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setUploadPct((p) => {
        if (p >= 90) return p;
        return p + 15;
      });
    }, 110);
    run().finally(() => {
      if (timerRef.current) clearInterval(timerRef.current);
      setUploadPct(100);
      setTimeout(() => {
        setUploadState('idle');
        setStep(2);
        setTimeout(() => reveal(reviewRef.current, `List read — ${intakeState.cleanCount} ready, ${intakeState.heldCount} held out of ${intakeState.rows.length} rows.`), 60);
      }, 200);
    });
  };

  const onFile = (file: File) => {
    runUpload(file.name, async () => {
      const result = await parseRimReturnsWorkbook(file);
      intakeState.setParsed(result);
    });
  };

  const checkManualRows = () => {
    const entries = manualRows.filter((r) => r.customerAssetNo.trim() || r.rimSerial.trim());
    runUpload('Typed in by hand', async () => {
      const result = parseManualRows(entries);
      intakeState.setParsed(result);
    });
  };

  const createJobs = () => {
    const cleanRows = intake.rows.filter((r) => r.state === 'clean');
    cleanRows.forEach((row) => {
      store.createRimJobFromIntake(row, intake.customer, `${intake.customer} — site not specified`);
    });
    intakeState.removeCreated(cleanRows.map((r) => r.row));
    setJustCreated({ created: cleanRows.length, held: intake.heldCount, total: intake.rows.length });
    setStep(3);
  };

  return (
    <main style={{ maxWidth: 1480, margin: '0 auto', padding: '22px 24px 90px' }}>
      <HeaderSlot
        right={(
          <>
            <RimTabs active="intake" />
            <Button variant="steel-ghost" onClick={tour.start}>Show me around</Button>
          </>
        )}
      />
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 26, flexWrap: 'wrap', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--td-ink-3)', marginBottom: 5 }}>Rim NDT — intake</div>
          <h1 style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 42, lineHeight: 1, margin: 0 }}>Take in a list of rims</h1>
        </div>
        <div ref={tour.setRef('stepper')} style={{ display: 'flex', gap: 10, marginLeft: 'auto', alignItems: 'stretch' }}>
          {[{ n: 1, label: 'Upload or type' }, { n: 2, label: 'Review and fix' }, { n: 3, label: 'Create the jobs' }].map((c) => {
            const active = c.n === step; const done = c.n < step;
            return (
              <div
                key={c.n}
                style={{
                  border: `2px solid ${active ? 'var(--td-blue)' : done ? 'var(--td-pass)' : 'var(--td-line)'}`, borderRadius: 'var(--td-r-md)',
                  background: active ? 'var(--td-blue)' : done ? 'var(--td-pass-tint)' : 'var(--td-paper)',
                  color: active ? '#fff' : done ? 'var(--td-pass-deep)' : 'var(--td-ink-3)', padding: '11px 18px', display: 'flex', alignItems: 'center', gap: 11,
                }}
              >
                <span style={{
                  width: 26, height: 26, borderRadius: '50%', background: active ? '#fff' : done ? 'var(--td-pass)' : 'var(--td-ground)',
                  color: active ? 'var(--td-blue)' : done ? '#fff' : 'var(--td-ink-3)', display: 'grid', placeItems: 'center', fontFamily: 'var(--td-mono)', fontSize: 14, fontWeight: 600, flex: 'none',
                }}
                >
                  {done ? '✓' : c.n}
                </span>
                <span style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 19 }}>{c.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {step === 1 && (
        <Card style={{ overflow: 'hidden', animation: 'tdRise 320ms ease-out both' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--td-line)', flexWrap: 'wrap', alignItems: 'center' }}>
            <button type="button" onClick={() => setMode('upload')} style={tabBtn(mode === 'upload')}>Drop the mine&rsquo;s list</button>
            <button type="button" onClick={() => setMode('manual')} style={tabBtn(mode === 'manual')}>Type them in</button>
            <span style={{ marginLeft: 'auto', padding: '0 22px', fontSize: 16, color: 'var(--td-ink-2)' }}>Some mines send a spreadsheet. Some just ring up. Both work.</span>
          </div>

          {mode === 'upload' ? (
            <div style={{ padding: 32 }}>
              {uploadState === 'idle' ? (
                <div style={{ border: '3px dashed var(--td-line-strong)', borderRadius: 'var(--td-r-lg)', background: 'var(--td-ground-soft)', padding: '56px 30px', textAlign: 'center' }}>
                  <div style={{ width: 72, height: 72, margin: '0 auto 20px', borderRadius: '50%', background: 'var(--td-blue-tint)', display: 'grid', placeItems: 'center' }}>
                    <span style={{ display: 'block', width: 26, height: 26, borderLeft: '3px solid var(--td-blue)', borderTop: '3px solid var(--td-blue)', transform: 'rotate(45deg)', marginTop: 7 }} />
                  </div>
                  <h2 style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 34, margin: '0 0 10px' }}>Drop the rim list here</h2>
                  <p style={{ fontSize: 17, color: 'var(--td-ink-2)', margin: '0 auto 26px', maxWidth: '40em' }}>
                    A spreadsheet with the asset numbers, rim serials, sizes and machine hours. Column names don&rsquo;t have to match — the parser maps them for you.
                  </p>
                  <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
                  <Button variant="primary" size="lg" onClick={() => fileInputRef.current?.click()}>Choose a file</Button>
                  <div style={{ fontSize: 15, color: 'var(--td-ink-3)', marginTop: 22 }}>Last list from Kurrajong Coal · 11 Jun 26 · 14 rims</div>
                </div>
              ) : (
                <div style={{ border: '1px solid var(--td-line)', borderRadius: 'var(--td-r-lg)', background: 'var(--td-ground-soft)', padding: '44px 32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 22, flexWrap: 'wrap' }}>
                    <div style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 27 }}>Reading the list</div>
                    <div style={{ marginLeft: 'auto', fontFamily: 'var(--td-mono)', fontSize: 24 }}>{uploadPct}%</div>
                  </div>
                  <div style={{ height: 10, borderRadius: 5, background: '#dce3e9', overflow: 'hidden' }}>
                    <div style={{ height: 10, borderRadius: 5, background: 'var(--td-blue)', width: `${uploadPct}%`, transition: 'width 120ms linear' }} />
                  </div>
                  <div style={{ fontSize: 16, color: 'var(--td-ink-2)', marginTop: 14 }}>Checking hours, duplicates and unknown rims as it goes.</div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: '26px 32px 32px' }}>
              <h2 style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 30, margin: '0 0 6px' }}>Type the rims in</h2>
              <p style={{ fontSize: 17, color: 'var(--td-ink-2)', margin: '0 0 22px' }}>One row per rim. Everything is checked the same way as an uploaded list.</p>
              <table style={{ width: '100%', fontSize: 16, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--td-ground-soft)' }}>
                    <th style={th(150)}>Asset no.</th><th style={th(170)}>Rim serial</th><th style={th()}>Size</th><th style={th(140)}>Machine</th><th style={th(140)}>Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {manualRows.map((row, i) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <tr key={i}>
                      {(['customerAssetNo', 'rimSerial', 'size', 'fleetNo', 'hours'] as const).map((key) => (
                        <td key={key} style={{ padding: '7px 12px 7px 0' }}>
                          <input
                            value={row[key]}
                            onChange={(e) => setManualRows((rs) => rs.map((r, ri) => (ri === i ? { ...r, [key]: e.target.value } : r)))}
                            placeholder={key === 'customerAssetNo' ? 'R-45__' : key === 'rimSerial' ? 'RM-88-____' : key === 'size' ? '63 in - 5 piece' : key === 'fleetNo' ? 'HT-___' : '10000'}
                            style={{ border: '1px solid var(--td-line-strong)', borderRadius: 'var(--td-r-sm)', width: '100%', fontFamily: key === 'size' ? undefined : 'var(--td-mono)', fontSize: 16, padding: 11 }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: 'flex', gap: 14, marginTop: 20, alignItems: 'center' }}>
                <Button variant="secondary" onClick={() => setManualRows((rs) => [...rs, { ...BLANK_MANUAL }])}>Add another rim</Button>
                <Button variant="primary" style={{ marginLeft: 'auto' }} onClick={checkManualRows}>Check these rims</Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {step === 2 && (
        <div style={{ animation: 'tdRise 320ms ease-out both' }}>
          <div ref={tour.setRef('held')}>
            {intake.heldCount > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ borderRadius: 'var(--td-r-lg)', overflow: 'hidden', border: '2px solid var(--td-hazard)', boxShadow: 'var(--td-card)', background: 'var(--td-paper)' }}>
                  <HazardHeader label={`${intake.heldCount} of ${intake.rows.length} rows can't become a job until someone confirms them`} />
                  <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 17 }}>Fix what you can in the table, or confirm a row as-is. Everything else becomes a job.</span>
                    <span style={{ marginLeft: 'auto', fontSize: 16, color: 'var(--td-ink-2)' }}>
                      <span style={{ fontFamily: 'var(--td-mono)', fontWeight: 600, color: 'var(--td-pass-deep)' }}>{intake.cleanCount}</span> ready ·
                      {' '}<span style={{ fontFamily: 'var(--td-mono)', fontWeight: 600, color: 'var(--td-hazard-deep)' }}>{intake.heldCount}</span> held
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Card style={{ overflow: 'hidden' }}>
            <div ref={reviewRef} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderBottom: '1px solid var(--td-line)', flexWrap: 'wrap' }}>
              <h2 style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 26, margin: 0 }}>Review the list</h2>
              <span style={{ fontSize: 16, color: 'var(--td-ink-2)' }}>{intake.fileName} · {intake.customer} · {intake.rows.length} rows</span>
            </div>
            <div style={{ maxHeight: 640, overflow: 'auto' }}>
              <table style={{ width: '100%', fontSize: 16, borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--td-ground-soft)', zIndex: 2 }}>
                  <tr>
                    <th style={th(48)}>Row</th><th style={th(134)}>Asset no.</th><th style={th(176)}>Rim serial</th><th style={th(210)}>Size</th>
                    <th style={th(104)}>Machine</th><th style={th(150)}>Hours</th><th style={th(130)}>Removed</th><th style={th(146)}>State</th>
                  </tr>
                </thead>
                <tbody>
                  {intake.rows.map((r) => <IntakeRowView key={r.row} row={r} />)}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', borderTop: '1px solid var(--td-line)', flexWrap: 'wrap', background: 'var(--td-ground-soft)' }}>
              <span style={{ fontSize: 17 }}>
                <span style={{ fontFamily: 'var(--td-mono)', fontWeight: 600 }}>{intake.cleanCount}</span> ready ·
                {' '}<span style={{ fontFamily: 'var(--td-mono)', fontWeight: 600, color: 'var(--td-hazard-deep)' }}>{intake.heldCount}</span> held
              </span>
              <Button variant="secondary" style={{ marginLeft: 'auto' }} onClick={() => setStep(1)}>Back</Button>
              <Button variant="primary" size="lg" disabled={intake.cleanCount === 0} onClick={createJobs}>Create {intake.cleanCount} jobs</Button>
            </div>
          </Card>
        </div>
      )}

      {step === 3 && (
        <Card variant="hero" style={{ padding: '44px 40px', animation: 'tdRise 320ms ease-out both' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18, maxWidth: 1000, margin: '0 auto 34px' }}>
            <StepStat value={justCreated.total} label="rows in" />
            <StepStat value={justCreated.created} label="jobs created" tone="pass" />
            <StepStat value={justCreated.held} label="held for a person" tone="hazard" />
          </div>
          <div style={{ maxWidth: 660, margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 36, margin: '0 0 12px' }}>The clean rims are on the floor.</h2>
            <p style={{ fontSize: 17, color: 'var(--td-ink-2)', lineHeight: 1.55, margin: '0 0 28px' }}>
              Each new job starts at Notified, with its hours at removal and its next test already set. The held rows stay on the console until someone confirms them — they never quietly become jobs.
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/console" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'var(--td-blue)', color: '#fff', fontSize: 18, fontWeight: 700, padding: '17px 26px', borderRadius: 'var(--td-r-md)', textDecoration: 'none', boxShadow: '0 10px 24px rgba(13,100,173,.3)' }}>
                Go to the floor <span style={{ fontSize: 20, lineHeight: 1 }}>→</span>
              </Link>
              <Button variant="secondary" size="lg" onClick={() => setStep(2)}>Back to the held rows</Button>
            </div>
          </div>
        </Card>
      )}

      {tour.active && <TourOverlay step={tour.step} rect={tour.rect} total={tour.total} text={tour.text} onNext={tour.next} onEnd={tour.end} />}
      {liveRegion}
    </main>
  );
}

function IntakeRowView({ row }: { row: IntakeRow }) {
  const probFor = (field: string) => row.problems.find((p) => p.field === field);
  const serialProb = probFor('rimSerial');
  const sizeProb = probFor('size');
  const hoursProb = probFor('hours');
  const assetProb = probFor('customerAssetNo');
  const dateProb = probFor('removedOn');
  const serialFixable = !!(serialProb?.code === 'blank_serial' && !row.rimSerial);
  const hoursFixable = !!(hoursProb?.code === 'blank_hours' && !row.hours);
  const sizeFixable = !!(sizeProb?.code === 'size_typo');

  return (
    <tr style={{ background: row.state === 'held' ? 'var(--td-hazard-tint)' : 'transparent' }}>
      <td style={{ ...td(), fontFamily: 'var(--td-mono)', color: 'var(--td-ink-3)', borderLeft: `5px solid ${row.state === 'held' ? 'var(--td-hazard)' : 'transparent'}` }}>{row.row}</td>
      <td style={td()}>
        <div style={{ fontFamily: 'var(--td-mono)', fontWeight: 600 }}>{row.customerAssetNo}</div>
        {assetProb && <div style={{ fontSize: 14, color: 'var(--td-hazard-deep)', lineHeight: 1.35, marginTop: 4 }}>{assetProb.message}</div>}
      </td>
      <td style={td()}>
        {serialFixable ? (
          <input
            defaultValue={row.rimSerial}
            onBlur={(e) => intakeState.fixField(row.row, 'rimSerial', e.target.value)}
            placeholder="type it off the rim"
            style={{ border: '2px solid var(--td-hazard)', borderRadius: 'var(--td-r-sm)', background: 'var(--td-hazard-tint)', width: '100%', fontFamily: 'var(--td-mono)', fontSize: 15, padding: 9 }}
          />
        ) : <span style={{ fontFamily: 'var(--td-mono)' }}>{row.rimSerial}</span>}
        {serialProb && !serialFixable && <div style={{ fontSize: 14, color: 'var(--td-hazard-deep)', lineHeight: 1.35, marginTop: 4 }}>{serialProb.message}</div>}
      </td>
      <td style={td()}>
        {sizeFixable ? (
          <div>
            <input
              defaultValue={row.size}
              onBlur={(e) => intakeState.fixField(row.row, 'size', e.target.value)}
              style={{ border: '2px solid var(--td-fail)', borderRadius: 'var(--td-r-sm)', background: 'var(--td-fail-tint)', width: '100%', fontSize: 15, padding: 9 }}
            />
            <div style={{ fontSize: 14, color: 'var(--td-fail-deep)', lineHeight: 1.35, marginTop: 4 }}>{sizeProb!.message}</div>
            <button
              type="button"
              onClick={() => intakeState.fixField(row.row, 'size', row.size)}
              style={{ marginTop: 6, border: '1px solid var(--td-blue)', background: 'var(--td-blue-tint)', color: 'var(--td-blue-deep)', borderRadius: 999, fontSize: 14, fontWeight: 600, padding: '5px 12px', cursor: 'pointer' }}
            >
              Confirm this size
            </button>
          </div>
        ) : <span>{row.size}</span>}
      </td>
      <td style={{ ...td(), fontFamily: 'var(--td-mono)' }}>{row.fleetNo}</td>
      <td style={td()}>
        {hoursFixable ? (
          <input
            defaultValue={row.hours}
            onBlur={(e) => intakeState.fixField(row.row, 'hours', e.target.value)}
            placeholder="hours"
            style={{ border: '2px solid var(--td-hazard)', borderRadius: 'var(--td-r-sm)', background: 'var(--td-hazard-tint)', width: '100%', fontFamily: 'var(--td-mono)', fontSize: 15, padding: 9 }}
          />
        ) : (
          <div>
            <span style={{ fontFamily: 'var(--td-mono)', fontWeight: 600, color: hoursProb?.needsHuman ? 'var(--td-hazard-deep)' : undefined, whiteSpace: 'nowrap' }}>
              {row.hours ? Number(row.hours).toLocaleString() + ' h' : '—'}
            </span>
            {hoursProb && <div style={{ fontSize: 14, color: 'var(--td-hazard-deep)', lineHeight: 1.35, marginTop: 4 }}>{hoursProb.message}</div>}
          </div>
        )}
      </td>
      <td style={td()}>
        <span style={{ fontFamily: 'var(--td-mono)', fontSize: 15, color: dateProb ? 'var(--td-fail-deep)' : 'var(--td-ink)' }}>{row.removedOn}</span>
        {dateProb && <div style={{ fontSize: 14, color: 'var(--td-fail-deep)', lineHeight: 1.35, marginTop: 4 }}>{dateProb.message}</div>}
      </td>
      <td style={td()}>
        {row.state === 'held' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
            <span style={{ background: 'var(--td-hazard)', color: 'var(--td-hazard-ink)', borderRadius: 999, padding: '4px 12px', fontSize: 14, fontWeight: 700 }}>Held</span>
            <button type="button" onClick={() => intakeState.confirmRow(row.row)} style={{ border: '1px solid var(--td-line-strong)', background: 'var(--td-paper)', color: 'var(--td-ink)', borderRadius: 'var(--td-r-sm)', fontSize: 14, fontWeight: 600, padding: '8px 12px', cursor: 'pointer' }}>
              Confirm anyway
            </button>
          </div>
        ) : <span style={{ background: 'var(--td-pass-tint)', color: 'var(--td-pass-deep)', borderRadius: 999, padding: '4px 12px', fontSize: 14, fontWeight: 700 }}>Ready</span>}
      </td>
    </tr>
  );
}

function StepStat({ value, label, tone }: { value: number; label: string; tone?: 'pass' | 'hazard' }) {
  const border = tone === 'pass' ? '2px solid var(--td-pass)' : tone === 'hazard' ? '2px solid var(--td-hazard)' : '1px solid var(--td-line)';
  const bg = tone === 'pass' ? 'var(--td-pass-tint)' : tone === 'hazard' ? 'var(--td-hazard-tint)' : 'var(--td-ground-soft)';
  const color = tone === 'pass' ? 'var(--td-pass-deep)' : tone === 'hazard' ? 'var(--td-hazard-deep)' : undefined;
  return (
    <div style={{ textAlign: 'center', padding: '28px 16px', border, borderRadius: 'var(--td-r-md)', background: bg }}>
      <div style={{ fontFamily: 'var(--td-mono)', fontSize: 64, fontWeight: 600, lineHeight: 1, color }}>{value}</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: color ?? 'var(--td-ink-2)', marginTop: 8 }}>{label}</div>
    </div>
  );
}

function tabBtn(active: boolean): React.CSSProperties {
  return {
    border: 'none', background: active ? 'var(--td-blue-tint)' : 'transparent', color: 'var(--td-ink)', fontSize: 17, fontWeight: 600,
    padding: '17px 24px', borderBottom: `4px solid ${active ? 'var(--td-blue)' : 'transparent'}`, cursor: 'pointer',
  };
}
function th(width?: number): React.CSSProperties {
  return { textAlign: 'left', padding: '11px 10px', borderBottom: '2px solid var(--td-line-strong)', width };
}
function td(): React.CSSProperties {
  return { padding: '11px 10px', borderBottom: '1px solid var(--td-line)', verticalAlign: 'top' };
}

export const CUSTOMER_NAMES = CUSTOMERS.map((c) => c.name);
