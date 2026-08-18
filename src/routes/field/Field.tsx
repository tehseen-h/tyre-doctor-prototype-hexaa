import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { store } from '../../data/store';
import { CUSTOMERS, SITES } from '../../data/fixtures';
import { categoryFor } from '../../config/rules';
import type { DamagePosition, EmailPreview, Job } from '../../types/domain';
import { TyreGlyph, DamageMark, WholeTyreMark, SerialPlateMark } from '../../components/Glyphs';
import { Button } from '../../components/Button';
import { EmailModal } from '../../components/EmailModal';
import { ResetDemo } from '../../components/ResetDemo';
import { useRevealAnnouncer } from '../../components/useRevealAnnouncer';
import { atLabel, dateLabel } from '../../data/format';
import tyreDoctorLogo from '../../assets/tyre-doctor-logo.svg';

const POSITIONS: DamagePosition[] = ['sidewall', 'tread', 'shoulder', 'bead'];
const MAKES = ['Bridgestone', 'Michelin', 'Goodyear'] as const;
const SIZES = ['40.00R57', '53/80R63', '33.00R51', '27.00R49', '24.00R35', '18.00R33'];

type PhotoState = 'empty' | 'busy' | 'done';

interface SavedTyre {
  jobNo: string; serial: string; repairable: boolean; position?: DamagePosition; sizeMm?: number; category?: Job['category']; reason?: string;
}

export function Field() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [customer, setCustomer] = useState('Wattlebank Coal');
  const [pallet, setPallet] = useState('6');
  const [visitNo] = useState(() => store.nextVisitNo());

  const [tyreN, setTyreN] = useState(1);
  const [photos, setPhotos] = useState<Record<'plate' | 'damage' | 'whole', PhotoState>>({ plate: 'empty', damage: 'empty', whole: 'empty' });
  const [pct, setPct] = useState(0);
  const uploadTimer = useRef<ReturnType<typeof setInterval>>();
  const [serial, setSerial] = useState('');
  const [repairable, setRepairable] = useState<boolean | null>(null);
  const [position, setPosition] = useState<DamagePosition | null>(null);
  const [reason, setReason] = useState('');
  const [saved, setSaved] = useState<SavedTyre[]>([]);
  const [email, setEmail] = useState<EmailPreview | null>(null);
  const { reveal, liveRegion } = useRevealAnnouncer();
  const firstSavedRef = useRef<HTMLDivElement | null>(null);
  const prevSavedCount = useRef(0);

  useEffect(() => () => { if (uploadTimer.current) clearInterval(uploadTimer.current); }, []);

  useEffect(() => {
    if (saved.length > prevSavedCount.current) {
      reveal(firstSavedRef.current, `${saved[0].serial} saved. ${saved.length} tyre${saved.length === 1 ? '' : 's'} recorded so far.`);
    }
    prevSavedCount.current = saved.length;
  }, [saved, reveal]);

  const site = SITES.find((s) => CUSTOMERS.find((c) => c.name === customer)?.id === s.customerId);

  const capture = (key: 'plate' | 'damage' | 'whole') => {
    if (photos[key] !== 'empty') return;
    setPhotos((p) => ({ ...p, [key]: 'busy' }));
    setPct(0);
    if (uploadTimer.current) clearInterval(uploadTimer.current);
    uploadTimer.current = setInterval(() => {
      setPct((p) => {
        const next = p + 20;
        if (next >= 100) {
          if (uploadTimer.current) clearInterval(uploadTimer.current);
          setPhotos((ph) => ({ ...ph, [key]: 'done' }));
          return 0;
        }
        return next;
      });
    }, 130);
  };

  const doneCount = Object.values(photos).filter((v) => v === 'done').length;
  const missing: string[] = [];
  if (doneCount < 3) missing.push(`${3 - doneCount} more ${3 - doneCount === 1 ? 'photo' : 'photos'}`);
  if (!serial) missing.push('the serial');
  if (repairable === null) missing.push('repairable, yes or no');
  if (!position) missing.push('where the damage is');
  if (repairable === false && !reason.trim()) missing.push('a reason');
  const blocked = missing.length > 0;

  const saveTyre = () => {
    const make = MAKES[saved.length % MAKES.length];
    const size = SIZES[saved.length % SIZES.length];
    const fleetNo = `FV-${10 + saved.length}`;
    const sizeMm = repairable ? 40 + saved.length * 27 : undefined;
    const category = repairable && sizeMm !== undefined ? categoryFor(sizeMm, false, position ?? undefined) : undefined;
    const job = store.createTyreJobFromTriage({
      branch: 'MKY', customer, site: site?.label ?? customer, visitNo,
      serial: serial || `BR7K4${8200 + saved.length}`, make, size, fleetNo,
      repairable: !!repairable, position: position ?? undefined, sizeMm, reason: reason || undefined,
      capturedBy: 'J. Whelan (repair mgr)', where: site?.name ?? customer, photos: [],
    });
    setSaved((s) => [{
      jobNo: job.jobNo, serial: job.asset.serial, repairable: !!repairable, position: position ?? undefined, sizeMm, category, reason: reason || undefined,
    }, ...s]);
    setTyreN((n) => n + 1);
    setSerial(''); setRepairable(null); setPosition(null); setReason('');
    setPhotos({ plate: 'empty', damage: 'empty', whole: 'empty' });
  };

  const assessed = saved.length;
  const repairableCount = saved.filter((s) => s.repairable).length;
  const rejectedCount = assessed - repairableCount;

  const sendEmail: EmailPreview = {
    to: 'sales@tyredoctor', from: 'TD One — Mackay',
    subject: `Initial inspection ready — ${customer}, ${site?.name ?? ''} (${assessed} ${assessed === 1 ? 'tyre' : 'tyres'})`,
    lines: [
      `Site visit ${visitNo} · ${dateLabel()} · assessed by J. Whelan.`,
      `${assessed} ${assessed === 1 ? 'tyre' : 'tyres'} assessed — ${repairableCount} repairable, ${rejectedCount} not repairable.`,
      `Serials: ${saved.map((s) => s.serial).join(', ') || '—'}.`,
      'Quote no. (from NetSuite): not yet raised.',
    ],
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(1000px 460px at 16% -6%, rgba(245,163,0,.20), transparent 58%),'
        + 'radial-gradient(900px 500px at 90% 10%, rgba(13,100,173,.22), transparent 60%), var(--td-night)',
      padding: '24px 20px 70px',
    }}
    >
      <div style={{ maxWidth: 1180, margin: '0 auto 22px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <Link to="/console" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#eaf3f8' }}>
          <img src={tyreDoctorLogo} alt="Tyre Doctor" style={{ height: 26, width: 'auto' }} />
        </Link>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: 'var(--td-hazard)', color: 'var(--td-hazard-ink)', borderRadius: 999, padding: '6px 14px', fontSize: 15, fontWeight: 700 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--td-hazard-ink)' }} />Mine site — on the phone
        </span>
        <span style={{ color: '#a9bec9', fontSize: 16 }}>Big targets, one thing per screen, works with gloves on.</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link to="/process-flow" style={{ color: '#eaf3f8', fontSize: 16, fontWeight: 600, textDecoration: 'none' }}>Process flow</Link>
          <ResetDemo dark />
          <Link to="/console" style={{ color: 'var(--td-hazard)', fontSize: 16, fontWeight: 600, textDecoration: 'none' }}>← Back to the Mackay floor</Link>
        </div>
      </div>

      <div style={{ maxWidth: 452, margin: '0 auto', background: 'var(--td-ground-soft)', border: '11px solid #050d12', borderRadius: 38, boxShadow: '0 28px 70px rgba(0,0,0,.6)', overflow: 'hidden' }}>
        <div style={{ background: 'var(--td-steel)', color: '#fff', padding: '12px 18px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'var(--td-mono)', fontSize: 12, opacity: 0.85, marginBottom: 12 }}>
            <span>{dateLabel()}</span><span>{site?.name ?? customer}</span><span>61%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {['Details', 'Photograph', 'Review and send'].map((label, i) => (
              <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                <div style={{ height: 5, borderRadius: 3, background: i + 1 <= step ? 'var(--td-hazard)' : 'rgba(234,243,248,.3)' }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: i + 1 <= step ? '#fff' : 'rgba(234,243,248,.6)' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {step === 1 && (
          <div style={{ padding: '22px 20px 28px', animation: 'tdRise 300ms ease-out both' }}>
            <h1 style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 38, lineHeight: 1.03, margin: '0 0 6px' }}>New site visit</h1>
            <p style={{ fontSize: 17, color: 'var(--td-ink-2)', margin: '0 0 24px' }}>One visit, one pile of tyres, one quote, one pickup.</p>

            <FieldLabel label="Customer">
              <select value={customer} onChange={(e) => setCustomer(e.target.value)} style={selectStyle}>
                {CUSTOMERS.map((c) => <option key={c.id}>{c.name}</option>)}
              </select>
            </FieldLabel>
            <FieldLabel label="Site">
              <select style={selectStyle}>
                <option>{site?.name ?? 'Main site'}</option>
              </select>
            </FieldLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 8 }}>
              <FieldLabel label="Date" noMargin>
                <input value={dateLabel()} readOnly style={{ ...selectStyle, fontFamily: 'var(--td-mono)' }} />
              </FieldLabel>
              <FieldLabel label="Tyres on the pallet" noMargin>
                <input value={pallet} onChange={(e) => setPallet(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" style={{ ...selectStyle, fontFamily: 'var(--td-mono)' }} />
              </FieldLabel>
            </div>
            <p style={{ fontSize: 15, color: 'var(--td-ink-2)', margin: '8px 0 24px' }}>A count, so the app can tell you when you have worked through the pile. You can add more as you go.</p>

            <div style={{ background: 'var(--td-blue-tint)', border: '1px solid rgba(13,100,173,.35)', borderRadius: 'var(--td-r-md)', padding: '14px 16px', fontSize: 16, marginBottom: 24 }}>
              Visit no. <span style={{ fontFamily: 'var(--td-mono)', fontWeight: 600 }}>{visitNo}</span> — assigned now, so photos have somewhere to land.
            </div>

            <Button variant="primary" size="xl" style={{ width: '100%', justifyContent: 'center', minHeight: 68 }} onClick={() => setStep(2)}>Start photographing</Button>
          </div>
        )}

        {step === 2 && (
          <div style={{ padding: '20px 20px 28px', animation: 'tdRise 300ms ease-out both' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
              <h1 style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 34, lineHeight: 1, margin: 0 }}>Tyre {tyreN} of {pallet || '?'}</h1>
              <span style={{ fontSize: 16, color: 'var(--td-ink-2)' }}>{saved.length} saved</span>
            </div>

            {saved.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--td-hazard-tint)', border: '1px solid rgba(245,163,0,.55)', borderRadius: 'var(--td-r-md)', padding: '13px 15px', marginBottom: 16 }}>
                <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--td-hazard)', color: 'var(--td-hazard-ink)', display: 'grid', placeItems: 'center', flex: 'none', fontFamily: 'var(--td-mono)', fontSize: 14, fontWeight: 600 }}>2</span>
                <span style={{ fontSize: 16, lineHeight: 1.35, color: 'var(--td-hazard-ink)' }}>2 photos are waiting for signal. They will send themselves.</span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 11, marginBottom: 10 }}>
              {(['plate', 'damage', 'whole'] as const).map((key) => {
                const st = photos[key];
                const label = key === 'plate' ? 'Serial plate' : key === 'damage' ? 'The damage' : 'Whole tyre';
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => capture(key)}
                    style={{
                      border: `2px solid ${st === 'done' ? 'var(--td-blue)' : 'var(--td-line-strong)'}`, borderRadius: 'var(--td-r-md)',
                      background: st === 'done' ? '#1b1f22' : 'var(--td-paper)', padding: 0, cursor: 'pointer', display: 'block', width: '100%',
                      aspectRatio: '3 / 4', position: 'relative', overflow: 'hidden',
                    }}
                  >
                    <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
                      {st === 'empty' && (
                        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '0 6px' }}>
                          <span style={{ width: 36, height: 27, border: '2.5px solid var(--td-ink-3)', borderRadius: 5, position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 13, height: 13, border: '2.5px solid var(--td-ink-3)', borderRadius: '50%' }} />
                          </span>
                          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--td-ink-2)', textAlign: 'center', lineHeight: 1.25 }}>{label}</span>
                        </span>
                      )}
                      {st === 'busy' && (
                        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '78%' }}>
                          <TyreGlyph size={40} spinning />
                          <span style={{ width: '100%', height: 6, borderRadius: 3, background: '#d9d4ce', overflow: 'hidden' }}>
                            <span style={{ display: 'block', height: 6, background: 'var(--td-blue)', width: `${pct}%` }} />
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--td-ink-2)' }}>Sending</span>
                        </span>
                      )}
                      {st === 'done' && (
                        <span style={{ position: 'absolute', inset: 0, display: 'block', background: 'radial-gradient(118% 96% at 30% 16%, #5a646d 0%, #2e353a 56%, #171b1e 100%)' }}>
                          <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
                            {key === 'plate' && <SerialPlateMark serial={serial || 'BR7K48225'} size="18.00R33" />}
                            {key === 'damage' && <DamageMark size={78} />}
                            {key === 'whole' && <WholeTyreMark size={82} />}
                          </span>
                          <span style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: 'rgba(9,13,16,.8)', padding: '5px 6px' }}>
                            <span style={{ display: 'block', fontFamily: 'var(--td-mono)', fontSize: 9, color: '#fff', lineHeight: 1.35 }}>{atLabel()}</span>
                            <span style={{ display: 'block', fontFamily: 'var(--td-mono)', fontSize: 9, color: 'var(--td-hazard)', lineHeight: 1.35 }}>Triaged · {site?.name ?? customer}</span>
                          </span>
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize: 15, color: 'var(--td-ink-2)', marginBottom: 20 }}>{doneCount === 3 ? 'All three photos captured.' : `${doneCount} of 3 photos on this tyre.`}</div>

            <FieldLabel label="Tyre serial">
              <input value={serial} onChange={(e) => setSerial(e.target.value.toUpperCase())} placeholder="BR7K48225" style={{ ...selectStyle, fontFamily: 'var(--td-mono)', fontSize: 24, letterSpacing: '.05em' }} />
            </FieldLabel>

            <div style={{ marginBottom: 20 }}>
              <span style={{ display: 'block', fontSize: 16, fontWeight: 600, marginBottom: 10 }}>Can it be repaired?</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Button variant={repairable === true ? 'primary' : 'secondary'} style={{ minHeight: 74, justifyContent: 'center', fontFamily: 'var(--td-display)', fontSize: 29 }} onClick={() => setRepairable(true)}>YES</Button>
                <Button variant={repairable === false ? 'fail' : 'secondary'} style={{ minHeight: 74, justifyContent: 'center', fontFamily: 'var(--td-display)', fontSize: 29 }} onClick={() => setRepairable(false)}>NO</Button>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <span style={{ display: 'block', fontSize: 16, fontWeight: 600, marginBottom: 10 }}>Where is the damage?</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {POSITIONS.map((p) => (
                  <Button key={p} variant={position === p ? 'primary' : 'secondary'} style={{ minHeight: 58, padding: '0 22px', fontFamily: 'var(--td-display)', fontSize: 22, textTransform: 'capitalize' }} onClick={() => setPosition(p)}>{p}</Button>
                ))}
              </div>
            </div>

            {repairable === false && (
              <FieldLabel label="Why can't it be repaired? Required." danger>
                <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Bead damage through the wire bundle" style={{ ...selectStyle, border: '2px solid var(--td-fail)' }} />
              </FieldLabel>
            )}

            {blocked && (
              <div style={{ borderLeft: '5px solid var(--td-fail)', background: 'var(--td-fail-tint)', borderRadius: 'var(--td-r-sm)', padding: '13px 15px', marginBottom: 16, fontSize: 16, color: 'var(--td-fail-deep)', lineHeight: 1.4 }}>
                Before you can save this tyre we still need {missing.join(', ')}.
              </div>
            )}

            <Button variant="primary" size="xl" disabled={blocked} style={{ width: '100%', justifyContent: 'center', minHeight: 70, marginBottom: 12 }} onClick={saveTyre}>Save and next tyre</Button>
            <Button variant="secondary" style={{ width: '100%', justifyContent: 'center', minHeight: 60, fontSize: 19 }} onClick={() => setStep(3)}>Finish the visit</Button>

            {saved.map((c, i) => (
              <div key={c.jobNo} ref={i === 0 ? firstSavedRef : undefined} style={{ marginTop: 14, border: '1px solid var(--td-line)', borderRadius: 'var(--td-r-md)', background: 'var(--td-paper)', padding: 14, display: 'flex', alignItems: 'center', gap: 13, animation: 'tdArrive 320ms ease-out both' }}>
                <TyreGlyph size={46} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontFamily: 'var(--td-mono)', fontSize: 17, fontWeight: 600 }}>{c.serial}</span>
                  <span style={{ display: 'block', fontSize: 15, color: 'var(--td-ink-2)' }}>{c.repairable ? `Repairable · ${c.position}` : (c.reason || 'Not repairable')}</span>
                </span>
                <span style={{ background: c.repairable ? 'var(--td-pass-tint)' : 'var(--td-fail-tint)', color: c.repairable ? 'var(--td-pass-deep)' : 'var(--td-fail-deep)', borderRadius: 999, padding: '4px 12px', fontSize: 14, fontWeight: 700 }}>
                  {c.repairable ? 'Saved' : 'Rejected'}
                </span>
              </div>
            ))}
          </div>
        )}

        {step === 3 && (
          <div style={{ padding: '20px 20px 28px', animation: 'tdRise 300ms ease-out both' }}>
            <h1 style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 34, lineHeight: 1.03, margin: '0 0 4px' }}>Visit summary</h1>
            <div style={{ fontSize: 16, color: 'var(--td-ink-2)', marginBottom: 20 }}><span style={{ fontFamily: 'var(--td-mono)' }}>{visitNo}</span> · {customer}, {site?.name} · {dateLabel()}</div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 11, marginBottom: 22 }}>
              <SummaryChip value={assessed} label="assessed" />
              <SummaryChip value={repairableCount} label="repairable" tone="pass" />
              <SummaryChip value={rejectedCount} label="rejected" tone="fail" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 24 }}>
              {saved.map((v) => (
                <div key={v.jobNo} style={{ border: `1px solid ${v.repairable ? 'var(--td-line)' : 'rgba(192,42,34,.45)'}`, borderRadius: 'var(--td-r-md)', background: v.repairable ? 'var(--td-paper)' : 'var(--td-fail-tint)', padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                    <TyreGlyph size={48} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--td-mono)', fontSize: 17, fontWeight: 600 }}>{v.serial}</div>
                    </div>
                    <span style={{ background: v.repairable ? 'var(--td-blue-tint)' : 'var(--td-fail-tint)', color: v.repairable ? 'var(--td-blue-deep)' : 'var(--td-fail-deep)', borderRadius: 999, padding: '4px 12px', fontSize: 14, fontWeight: 700 }}>
                      {v.repairable ? v.category : 'Not repairable'}
                    </span>
                  </div>
                  <div style={{ fontSize: 15, color: 'var(--td-ink-2)', marginTop: 10, lineHeight: 1.4 }}>
                    {v.repairable ? `${v.position} · ${v.sizeMm} mm measured on site` : v.reason}
                  </div>
                </div>
              ))}
              {saved.length === 0 && <div style={{ fontSize: 16, color: 'var(--td-ink-2)' }}>No tyres captured yet — go back to the pile.</div>}
            </div>

            <div style={{ background: 'var(--td-blue-tint)', border: '1px solid rgba(13,100,173,.35)', borderRadius: 'var(--td-r-md)', padding: 16, marginBottom: 22 }}>
              <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>What happens when you send</div>
              <div style={{ fontSize: 16, lineHeight: 1.5, color: 'var(--td-ink-2)' }}>Sales gets the batch summary and the serials, and raises the quote in NetSuite. The quote number comes back into this visit, and logistics is told to collect.</div>
            </div>

            <Button variant="primary" size="xl" style={{ width: '100%', justifyContent: 'center', minHeight: 70, marginBottom: 12 }} disabled={saved.length === 0} onClick={() => { store.commitVisit(); setEmail(sendEmail); }}>
              Send to sales
            </Button>
            <Button variant="secondary" style={{ width: '100%', justifyContent: 'center', minHeight: 60, fontSize: 19 }} onClick={() => setStep(2)}>Back to the pile</Button>
          </div>
        )}
      </div>

      {email && (
        <EmailModal
          email={email}
          onClose={() => setEmail(null)}
          footer={(
            <span>
              <Link to="/console" style={{ color: 'var(--td-blue)', fontWeight: 600 }}>Go to the floor →</Link>
            </span>
          )}
        />
      )}
      {liveRegion}
    </div>
  );
}

function FieldLabel({
  label, children, noMargin, danger,
}: { label: string; children: React.ReactNode; noMargin?: boolean; danger?: boolean }) {
  return (
    <label style={{ display: 'block', marginBottom: noMargin ? 0 : 20 }}>
      <span style={{ display: 'block', fontSize: 16, fontWeight: danger ? 700 : 600, color: danger ? 'var(--td-fail-deep)' : 'var(--td-ink)', marginBottom: 8 }}>{label}</span>
      {children}
    </label>
  );
}

function SummaryChip({ value, label, tone }: { value: number; label: string; tone?: 'pass' | 'fail' }) {
  const border = tone === 'pass' ? 'rgba(31,138,77,.45)' : tone === 'fail' ? 'rgba(192,42,34,.45)' : 'var(--td-line)';
  const bg = tone === 'pass' ? 'var(--td-pass-tint)' : tone === 'fail' ? 'var(--td-fail-tint)' : 'var(--td-paper)';
  const color = tone === 'pass' ? 'var(--td-pass-deep)' : tone === 'fail' ? 'var(--td-fail-deep)' : undefined;
  return (
    <div style={{ border: `1px solid ${border}`, borderRadius: 'var(--td-r-md)', background: bg, padding: 14 }}>
      <div style={{ fontFamily: 'var(--td-mono)', fontSize: 30, fontWeight: 600, lineHeight: 1, color }}>{value}</div>
      <div style={{ fontSize: 15, color: color ?? 'var(--td-ink-2)', marginTop: 3 }}>{label}</div>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  border: '1px solid var(--td-line-strong)', borderRadius: 'var(--td-r-md)', background: 'var(--td-paper)', color: 'var(--td-ink)',
  width: '100%', fontSize: 19, padding: '16px 14px', minHeight: 60,
};
