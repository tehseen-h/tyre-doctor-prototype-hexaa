import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useJob } from '../../data/useStore';
import { useAppState } from '../../app/AppState';
import { store } from '../../data/store';
import { RULES } from '../../config/rules';
import { RimGlyph } from '../../components/Glyphs';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { HazardHeader } from '../../components/HazardBand';
import { HeaderSlot } from '../../layout/HeaderSlot';
import { RimTabs } from './RimTabs';
import type { CrackLocation } from '../../types/domain';

const LOCATIONS: CrackLocation[] = ['flange', 'bead_seat', 'gutter', 'disc', 'weld'];
const LOCATION_LABEL: Record<CrackLocation, string> = { flange: 'flange', bead_seat: 'bead seat', gutter: 'gutter', disc: 'disc', weld: 'weld' };
// Laid out so leader-line labels never collide with the pin markers (PRD §11 defect #9).
const LOCATION_POS: Record<CrackLocation, { x: number; y: number }> = {
  gutter: { x: 50, y: 15 }, bead_seat: { x: 27, y: 22 }, flange: { x: 20, y: 67 }, disc: { x: 39, y: 42 }, weld: { x: 82, y: 50 },
};
const CRACK_TYPES = ['Circumferential crack', 'Radial crack', 'Toe crack at weld', 'Bead seat wear beyond limit'];
const COMPETENCY_UNITS = RULES.competencyUnits.values;
const METHODS = RULES.ndtMethods.map((m) => `${m.label} (${m.standard})`);

export function NdtBay() {
  const { jobNo } = useParams();
  const job = useJob(jobNo);
  const { role } = useAppState();
  const navigate = useNavigate();

  const [location, setLocation] = useState<CrackLocation | null>(null);
  const [crackType, setCrackType] = useState(CRACK_TYPES[0]);
  const [lengthMm, setLengthMm] = useState('40');
  const [method, setMethod] = useState(METHODS[0]);
  const [technician, setTechnician] = useState('A. Petrov');
  const [competencyUnit, setCompetencyUnit] = useState<string>(COMPETENCY_UNITS[3]);
  const [resultOverride, setResultOverride] = useState<'pass' | 'fail' | null>(null);

  if (!job) return null;

  const preTest = job.stage === 'notified' || job.stage === 'rim_received' || job.stage === 'blasted';
  const testing = job.stage === 'ndt_tested';
  const findings = job.findings ?? [];
  const effectiveResult = resultOverride ?? (findings.length > 0 ? 'fail' : 'pass');

  const advanceSimple = (label: string) => {
    store.advance(job.jobNo, { by: role.label });
  };

  return (
    <main style={{ maxWidth: 1480, margin: '0 auto', padding: '22px 24px 90px' }}>
      <HeaderSlot right={<RimTabs active="ndt" jobNo={jobNo} />} />
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 28, flexWrap: 'wrap', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <RimGlyph size={64} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--td-ink-3)' }}>Rim NDT · <span style={{ fontFamily: 'var(--td-mono)' }}>{job.jobNo}</span></div>
            <h1 style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 42, lineHeight: 1, margin: '2px 0 0' }}>NDT bay</h1>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,auto)', gap: '10px 32px' }}>
          <MiniField label="Customer asset" value={job.asset.customerAssetNo ?? '—'} />
          <MiniField label="Rim serial" value={job.asset.serial} />
          <MiniField label="Hours at removal" value={`${(job.asset.hoursAtRemoval ?? 0).toLocaleString()} h`} />
          <MiniField label="Size" value={job.asset.size ?? '—'} />
        </div>
      </div>

      {preTest && (
        <Card style={{ padding: 28, maxWidth: 620 }}>
          <h2 style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 26, margin: '0 0 10px' }}>Before the test</h2>
          <p style={{ fontSize: 16, color: 'var(--td-ink-2)', margin: '0 0 20px' }}>
            {job.stage === 'notified' && 'The mine has sent this rim in. Confirm it has physically arrived at the workshop.'}
            {job.stage === 'rim_received' && 'Confirm the rim has been through the blast booth.'}
            {job.stage === 'blasted' && 'Blasted and ready — begin the crack test.'}
          </p>
          <Button variant="primary" size="lg" onClick={() => advanceSimple('')}>
            {job.stage === 'notified' ? 'Confirm received' : job.stage === 'rim_received' ? 'Confirm blasted' : 'Start the crack test'}
          </Button>
        </Card>
      )}

      {testing && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 430px', gap: 18, alignItems: 'start' }}>
          <Card style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
              <h2 style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 28, margin: 0 }}>Where the cracks are</h2>
              <span style={{ fontSize: 16, color: 'var(--td-ink-2)' }}>pick a location, then pin the finding</span>
            </div>
            <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
              <div style={{
                position: 'relative', width: 320, height: 320, flex: 'none', borderRadius: 'var(--td-r-md)',
                background: 'repeating-linear-gradient(0deg, rgba(13,100,173,.08) 0 1px, transparent 1px 24px), repeating-linear-gradient(90deg, rgba(13,100,173,.08) 0 1px, transparent 1px 24px), var(--td-ground-soft)',
                border: '1px solid var(--td-line)', overflow: 'hidden',
              }}
              >
                <svg viewBox="0 0 320 320" width={320} height={320} style={{ display: 'block' }} aria-label="Rim plan view">
                  <circle cx={160} cy={160} r={145} fill="none" stroke="var(--td-steel)" strokeWidth={2} />
                  <circle cx={160} cy={160} r={130} fill="none" stroke="#7d8990" strokeWidth={1.2} />
                  <circle cx={160} cy={160} r={106} fill="none" stroke="#7d8990" strokeWidth={1.2} />
                  <circle cx={160} cy={160} r={54} fill="none" stroke="var(--td-steel)" strokeWidth={2} />
                  <circle cx={160} cy={160} r={19} fill="none" stroke="#7d8990" strokeWidth={1.2} />
                  <text x={272} y={314} fontFamily="IBM Plex Mono, monospace" fontSize={10} fill="#65757f">PLAN VIEW · {job.asset.customerAssetNo}</text>
                </svg>
                {findings.map((f) => {
                  const p = LOCATION_POS[f.location];
                  return (
                    <div key={f.id} style={{ position: 'absolute', left: `${p.x}%`, top: `${p.y}%`, transform: 'translate(-50%,-50%)', animation: 'tdPop 340ms cubic-bezier(.3,1.2,.4,1) both' }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--td-fail)', color: '#fff', display: 'grid', placeItems: 'center', fontFamily: 'var(--td-mono)', fontSize: 14, fontWeight: 600, boxShadow: '0 3px 12px rgba(192,42,34,.55)', border: '2px solid #fff' }}>
                        {findings.indexOf(f) + 1}
                      </div>
                      <div style={{ fontSize: 11, fontFamily: 'var(--td-mono)', color: 'var(--td-ink-2)', textAlign: 'center', marginTop: 2, whiteSpace: 'nowrap' }}>{LOCATION_LABEL[f.location]}</div>
                    </div>
                  );
                })}
              </div>

              <div style={{ flex: 1, minWidth: 240 }}>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>Crack location</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginBottom: 20 }}>
                  {LOCATIONS.map((l) => (
                    <Button key={l} variant={location === l ? 'fail' : 'secondary'} style={{ fontFamily: 'var(--td-display)', fontSize: 18, textTransform: 'capitalize' }} onClick={() => setLocation(l)}>
                      {LOCATION_LABEL[l]}
                    </Button>
                  ))}
                </div>
                <label style={{ display: 'block', marginBottom: 16 }}>
                  <span style={{ display: 'block', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Crack type</span>
                  <select value={crackType} onChange={(e) => setCrackType(e.target.value)} style={selStyle}>
                    {CRACK_TYPES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </label>
                <label style={{ display: 'block', marginBottom: 18 }}>
                  <span style={{ display: 'block', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Length in mm</span>
                  <input value={lengthMm} onChange={(e) => setLengthMm(e.target.value.replace(/[^0-9]/g, ''))} style={{ ...selStyle, width: 130, fontFamily: 'var(--td-mono)', fontSize: 19 }} />
                </label>
                <Button
                  variant="primary"
                  disabled={!location || !lengthMm}
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => {
                    store.addFinding(job.jobNo, { location: location!, type: crackType, lengthMm: Number(lengthMm), x: 0, y: 0 });
                    setResultOverride('fail');
                    setLocation(null);
                  }}
                >
                  Pin this finding
                </Button>
              </div>
            </div>

            {findings.length > 0 && (
              <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--td-line)' }}>
                <h3 style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 24, margin: '0 0 12px' }}>Findings</h3>
                <table style={{ width: '100%', fontSize: 16, borderCollapse: 'collapse' }}>
                  <thead><tr style={{ background: 'var(--td-ground-soft)' }}><th style={fth(52)}>#</th><th style={fth(140)}>Location</th><th style={fth()}>Type</th><th style={fth(110)}>Length</th></tr></thead>
                  <tbody>
                    {findings.map((f, i) => (
                      <tr key={f.id}>
                        <td style={ftd()}><span style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--td-fail)', color: '#fff', display: 'grid', placeItems: 'center', fontFamily: 'var(--td-mono)', fontSize: 14, fontWeight: 600 }}>{i + 1}</span></td>
                        <td style={{ ...ftd(), textTransform: 'capitalize' }}>{LOCATION_LABEL[f.location]}</td>
                        <td style={ftd()}>{f.type}</td>
                        <td style={{ ...ftd(), fontFamily: 'var(--td-mono)' }}>{f.lengthMm} mm</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Card style={{ padding: 22 }}>
              <h2 style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 26, margin: '0 0 16px' }}>The test</h2>
              <label style={{ display: 'block', marginBottom: 16 }}>
                <span style={{ display: 'block', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Method</span>
                <select value={method} onChange={(e) => setMethod(e.target.value)} style={selStyle}>{METHODS.map((m) => <option key={m}>{m}</option>)}</select>
              </label>
              <label style={{ display: 'block', marginBottom: 16 }}>
                <span style={{ display: 'block', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Technician</span>
                <input value={technician} onChange={(e) => setTechnician(e.target.value)} style={selStyle} />
              </label>
              <label style={{ display: 'block', marginBottom: 18 }}>
                <span style={{ display: 'block', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Competency unit</span>
                <select value={competencyUnit} onChange={(e) => setCompetencyUnit(e.target.value)} style={{ ...selStyle, fontFamily: 'var(--td-mono)' }}>
                  {COMPETENCY_UNITS.map((u) => <option key={u}>{u}</option>)}
                </select>
              </label>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>Result</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
                <Button variant={effectiveResult === 'pass' ? 'pass' : 'secondary'} style={{ minHeight: 66, justifyContent: 'center', fontFamily: 'var(--td-display)', fontSize: 24 }} onClick={() => setResultOverride('pass')}>PASS</Button>
                <Button variant={effectiveResult === 'fail' ? 'fail' : 'secondary'} style={{ minHeight: 66, justifyContent: 'center', fontFamily: 'var(--td-display)', fontSize: 24 }} onClick={() => setResultOverride('fail')}>FAIL</Button>
              </div>
            </Card>

            {effectiveResult === 'fail' ? (
              <div style={{ borderRadius: 'var(--td-r-lg)', overflow: 'hidden', border: '2px solid var(--td-hazard)', boxShadow: 'var(--td-card)', background: 'var(--td-paper)' }}>
                <HazardHeader label="Needs a person" />
                <div style={{ padding: 18 }}>
                  <div style={{ fontSize: 17, lineHeight: 1.5, marginBottom: 14 }}>{findings.length} cracks found. Sales is told, the rim goes to repair, and it must be re-tested before it can be certified.</div>
                  <div title={RULES.retestAfterRepair.source} style={{ fontSize: 15, color: 'var(--td-ink-2)', marginBottom: 16, cursor: 'help' }}>A re-test is required before certifying.</div>
                  <Button
                    variant="hazard"
                    disabled={findings.length === 0}
                    onClick={() => { store.advanceTo(job.jobNo, 'rim_repaired', { by: role.label, payload: { method, technician, competency_unit: competencyUnit } }); }}
                  >
                    Send to sales and route to repair
                  </Button>
                </div>
              </div>
            ) : (
              <div style={{ border: '2px solid var(--td-pass)', borderRadius: 'var(--td-r-lg)', background: 'var(--td-pass-tint)', padding: 20 }}>
                <div style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 24, color: 'var(--td-pass-deep)', marginBottom: 8 }}>No cracks found — the paint path</div>
                <div style={{ fontSize: 17, lineHeight: 1.5, color: 'var(--td-pass-deep)', marginBottom: 16 }}>
                  Blast, test, paint confirmed. Certificates can be issued, and the next test falls due at <span style={{ fontFamily: 'var(--td-mono)' }}>{((job.asset.hoursAtRemoval ?? 0) + 10000).toLocaleString()} h</span>.
                </div>
                <Button
                  variant="pass"
                  onClick={() => {
                    store.advanceTo(job.jobNo, 'btp', { by: role.label, payload: { method, technician, competency_unit: competencyUnit } });
                    store.advanceTo(job.jobNo, 'certified', { by: role.label });
                    store.issueCertificates(job.jobNo, {
                      method, technician, competencyUnit, wasRepaired: false,
                    });
                    navigate(`/rim/${job.jobNo}/certs`);
                  }}
                >
                  Issue the certificates
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {job.stage === 'rim_repaired' && (
        <Card style={{ padding: 28, maxWidth: 620 }}>
          <h2 style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 26, margin: '0 0 10px' }}>Repair recorded</h2>
          <p style={{ fontSize: 16, color: 'var(--td-ink-2)', margin: '0 0 20px' }}>
            {findings.length} finding{findings.length === 1 ? '' : 's'} repaired — sections cut out, cracks welded, or sections replaced. Ready for the re-test.
          </p>
          <Button variant="primary" size="lg" onClick={() => store.advanceTo(job.jobNo, 'retested', { by: role.label })}>Confirm re-test — pass</Button>
        </Card>
      )}

      {job.stage === 'retested' && (
        <Card style={{ padding: 28, maxWidth: 620 }}>
          <h2 style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 26, margin: '0 0 10px' }}>Re-tested — clean</h2>
          <p style={{ fontSize: 16, color: 'var(--td-ink-2)', margin: '0 0 20px' }}>The repair held. Certificates can now be issued for both the NDT result and the repair work performed.</p>
          <Button
            variant="pass"
            size="lg"
            onClick={() => {
              store.advanceTo(job.jobNo, 'certified', { by: role.label });
              store.issueCertificates(job.jobNo, {
                method, technician, competencyUnit, wasRepaired: true,
              });
              navigate(`/rim/${job.jobNo}/certs`);
            }}
          >
            Issue the certificates
          </Button>
        </Card>
      )}

      {job.stage === 'btp' && (
        <Card style={{ padding: 28, maxWidth: 620 }}>
          <h2 style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 26, margin: '0 0 10px' }}>Blast, test, paint</h2>
          <p style={{ fontSize: 16, color: 'var(--td-ink-2)', margin: '0 0 20px' }}>Clean rim, painted and ready. Issue the certificate pair to close this out.</p>
          <Button
            variant="pass"
            size="lg"
            onClick={() => {
              store.advanceTo(job.jobNo, 'certified', { by: role.label });
              store.issueCertificates(job.jobNo, {
                method, technician, competencyUnit, wasRepaired: false,
              });
              navigate(`/rim/${job.jobNo}/certs`);
            }}
          >
            Issue the certificates
          </Button>
        </Card>
      )}

      {(job.stage === 'certified' || job.stage === 'rim_dispatched' || job.stage === 'rim_closed') && (
        <Card style={{ padding: 28, maxWidth: 620 }}>
          <h2 style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 26, margin: '0 0 10px' }}>Certified</h2>
          <p style={{ fontSize: 16, color: 'var(--td-ink-2)', margin: '0 0 20px' }}>This rim already has its certificates.</p>
          <Button variant="primary" size="lg" onClick={() => navigate(`/rim/${job.jobNo}/certs`)}>View the certificates</Button>
        </Card>
      )}
    </main>
  );
}

function MiniField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--td-ink-3)' }}>{label}</div>
      <div style={{ fontFamily: 'var(--td-mono)', fontSize: 18, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

const selStyle: React.CSSProperties = {
  border: '1px solid var(--td-line-strong)', borderRadius: 'var(--td-r-md)', background: 'var(--td-paper)', color: 'var(--td-ink)', width: '100%', fontSize: 16, padding: 12,
};
function fth(width?: number): React.CSSProperties { return { textAlign: 'left', padding: 10, borderBottom: '2px solid var(--td-line-strong)', width }; }
function ftd(): React.CSSProperties { return { padding: 10, borderBottom: '1px solid var(--td-line)' }; }
