import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useJob } from '../../data/useStore';
import { Button } from '../../components/Button';
import { RULES } from '../../config/rules';
import { HeaderSlot } from '../../layout/HeaderSlot';
import { useRevealAnnouncer } from '../../components/useRevealAnnouncer';
import { RimTabs } from './RimTabs';

export function Certificates() {
  const { jobNo } = useParams();
  const job = useJob(jobNo);
  const firstCertRef = useRef<HTMLDivElement | null>(null);
  const { reveal, liveRegion } = useRevealAnnouncer();
  const certCount = job?.certificates?.length ?? 0;

  useEffect(() => {
    if (certCount > 0) {
      reveal(firstCertRef.current, `${certCount} certificate${certCount === 1 ? '' : 's'} issued for ${job?.jobNo}.`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [certCount]);

  if (!job) return null;
  const certs = job.certificates ?? [];

  if (certs.length === 0) {
    return (
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '60px 24px' }}>
        <HeaderSlot right={<RimTabs active="certs" jobNo={jobNo} />} />
        <h1 style={{ fontFamily: 'var(--td-display)' }}>No certificates yet</h1>
        <p style={{ color: 'var(--td-ink-2)' }}>This rim hasn&rsquo;t been certified. Issue them from the NDT bay once the test (and any repair) is complete.</p>
      </main>
    );
  }

  return (
    <main className="no-print-bg" style={{ background: '#5a6672', padding: '26px 20px 80px' }}>
      <HeaderSlot right={<RimTabs active="certs" jobNo={jobNo} />} />
      <div className="no-print" style={{ maxWidth: 920, margin: '0 auto 18px', display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ color: '#eaf3f8', fontSize: 16 }}>Two certificates, numbered, issued together.</span>
        <Button variant="primary" style={{ marginLeft: 'auto' }} onClick={() => window.print()}>Print or save</Button>
      </div>

      {certs.map((c, i) => (
        <div key={c.number} ref={i === 0 ? firstCertRef : undefined} style={{ maxWidth: 920, margin: '0 auto 26px', background: '#fff', padding: '52px 58px', boxShadow: 'var(--td-lift)', borderRadius: 6, position: 'relative', overflow: 'hidden' }}>
          <div aria-hidden style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
            <span style={{
              fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 62, letterSpacing: '.08em', color: 'rgba(192,42,34,.14)',
              transform: 'rotate(-24deg)', whiteSpace: 'nowrap', border: '4px solid rgba(192,42,34,.14)', borderRadius: 12, padding: '12px 30px',
            }}
            >
              PLACEHOLDER TEMPLATE
            </span>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, borderBottom: '3px solid var(--td-steel)', paddingBottom: 18, marginBottom: 26 }}>
              <div>
                <div style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 24, textTransform: 'uppercase' }}>Tyre Doctor</div>
                <div style={{ fontFamily: 'var(--td-display)', fontWeight: 600, fontSize: 34, lineHeight: 1.05 }}>
                  {c.kind === 'ndt' ? 'Rim NDT certificate' : 'Rim repair certificate'}
                </div>
                <div style={{ fontSize: 16, color: 'var(--td-ink-2)', marginTop: 4 }}>
                  {c.kind === 'ndt' ? 'Non-destructive crack testing of an earthmoving rim assembly' : 'Work performed on the rim assembly before it returns to service'}
                </div>
              </div>
              <div style={{ textAlign: 'right', fontFamily: 'var(--td-mono)', fontSize: 14, lineHeight: 1.8 }}>
                <div style={{ fontSize: 18, fontWeight: 600 }}>{c.number}</div>
                <div>issued {c.issuedAt}</div>
                <div>{job.branch} — Mackay</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '18px 26px', marginBottom: 26 }}>
              <CField label="Customer" value={job.customer} />
              <CField label="Site" value={job.site.split(' — ')[1] ?? job.site} />
              <CField label="Job no." value={job.jobNo} mono />
              <CField label="Customer asset no." value={job.asset.customerAssetNo ?? '—'} mono />
              <CField label="Rim serial" value={job.asset.serial} mono />
              <CField label="Rim size" value={job.asset.size ?? '—'} />
              <CField label="Fleet / machine" value={job.asset.fleetNo ?? '—'} mono />
              <CField label="Hours at removal" value={`${(job.asset.hoursAtRemoval ?? 0).toLocaleString()} h`} mono />
              <CField label="Next test due" value={`${(c.nextNdtDueHours ?? 0).toLocaleString()} h`} mono bold />
            </div>

            <div style={{ borderTop: '1px solid var(--td-line-strong)', paddingTop: 20, marginBottom: 24 }}>
              <div style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 22, marginBottom: 12 }}>{c.kind === 'ndt' ? 'Test record' : 'Work record'}</div>
              <table style={{ width: '100%', fontSize: 15, borderCollapse: 'collapse' }}>
                <tbody>
                  {(c.kind === 'ndt' ? [
                    ['Method', c.method],
                    ['Areas tested', 'Flange, bead seat, gutter, disc and weld seams'],
                    ['Findings', job.findings && job.findings.length ? `${job.findings.length} crack${job.findings.length > 1 ? 's' : ''} — repaired and re-tested` : 'No cracks detected'],
                    ['Result', 'Pass'],
                    ['Service performed', c.method],
                    ["Interval applied", `${RULES.ndtInterval.value.toLocaleString()} machine hours — this customer's interval`],
                  ] : [
                    ['Sections cut out', job.findings?.length ? `${job.findings.length}` : 'None'],
                    ['Cracks welded', job.findings?.length ? 'As required' : 'None'],
                    ['Sections replaced', 'None'],
                    ['Surface treatment', 'Blasted and painted'],
                    ['Re-test after repair', job.findings?.length ? 'Passed' : 'Not required — no repair performed'],
                    ['Marking', 'Rim marked and reported — AS 4457.1-2007 §5.7'],
                  ]).map(([k, v]) => (
                    <tr key={k}>
                      <td style={{ width: 250, padding: '9px 10px 9px 0', borderBottom: '1px solid var(--td-line)', color: 'var(--td-ink-2)' }}>{k}</td>
                      <td style={{ padding: '9px 0', borderBottom: '1px solid var(--td-line)' }}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30, marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--td-ink-3)', marginBottom: 6 }}>Technician</div>
                <div style={{ fontSize: 17 }}>{c.technician}</div>
                <div style={{ fontFamily: 'var(--td-mono)', fontSize: 15, color: 'var(--td-ink-2)' }}>{c.competencyUnit} · refresher current</div>
                <div style={{ height: 46, borderBottom: '1px solid var(--td-ink)', marginTop: 16 }} />
                <div style={{ fontSize: 13, color: 'var(--td-ink-3)', marginTop: 5 }}>Signature</div>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--td-ink-3)', marginBottom: 6 }}>Marked and stamped after repair</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  <span style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--td-pass)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 14 }}>✓</span>
                  <span style={{ fontSize: 17 }}>Rim marked and reported</span>
                </div>
                <div style={{ fontSize: 14, color: 'var(--td-ink-2)', marginTop: 7, lineHeight: 1.45 }}>{RULES.markingAfterRepair.label} — {RULES.markingAfterRepair.source}.</div>
                <div style={{ height: 46, borderBottom: '1px solid var(--td-ink)', marginTop: 16 }} />
                <div style={{ fontSize: 13, color: 'var(--td-ink-3)', marginTop: 5 }}>Supervisor</div>
              </div>
            </div>

            <div style={{ paddingTop: 16, borderTop: '1px solid var(--td-line-strong)', display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--td-mono)', fontSize: 12, color: 'var(--td-ink-3)' }}>
              <span>{c.number} · Tyre Doctor Mackay</span><span>Page 1 of 1</span>
            </div>
          </div>
        </div>
      ))}
      {liveRegion}
    </main>
  );
}

function CField({
  label, value, mono, bold,
}: { label: string; value: string; mono?: boolean; bold?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--td-ink-3)' }}>{label}</div>
      <div style={{ fontFamily: mono ? 'var(--td-mono)' : undefined, fontSize: 17, fontWeight: bold ? 600 : 400 }}>{value}</div>
    </div>
  );
}
