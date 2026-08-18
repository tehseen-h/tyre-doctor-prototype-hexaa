import { Fragment } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useJob } from '../../data/useStore';
import { railStages } from '../../config/stages';
import { Button } from '../../components/Button';
import { HeaderSlot } from '../../layout/HeaderSlot';
import { fmtHms } from '../../data/format';

export function JobReport() {
  const { jobNo } = useParams();
  const job = useJob(jobNo);
  const navigate = useNavigate();

  if (!job) return null;
  const stages = railStages(job.rail);
  const recorded = job.events.filter((e) => !e.payload?.action);

  return (
    <main className="no-print-bg" style={{ background: '#5a6672', padding: '26px 20px 80px' }}>
      <HeaderSlot middle={<span style={{ marginLeft: 'auto', fontFamily: 'var(--td-mono)', fontSize: 15 }}>{jobNo} · report</span>} />
      <div className="no-print" style={{ maxWidth: 880, margin: '0 auto 18px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <Button variant="secondary" onClick={() => navigate(`/jobs/${job.jobNo}`)}>← Back to the job file</Button>
        <Button variant="primary" style={{ marginLeft: 'auto' }} onClick={() => window.print()}>Print or save</Button>
      </div>
      <div style={{ maxWidth: 880, margin: '0 auto', background: '#fff', padding: '48px 54px', boxShadow: 'var(--td-lift)', borderRadius: 6 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, borderBottom: '3px solid var(--td-steel)', paddingBottom: 16, marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 24, textTransform: 'uppercase' }}>Tyre Doctor</div>
            <div style={{ fontFamily: 'var(--td-display)', fontWeight: 600, fontSize: 32, lineHeight: 1.05 }}>{job.rail === 'tyre' ? 'Tyre repair job report' : 'Rim job report'}</div>
          </div>
          <div style={{ textAlign: 'right', fontFamily: 'var(--td-mono)', fontSize: 14, lineHeight: 1.7 }}>
            <div style={{ fontSize: 17, fontWeight: 600 }}>{job.jobNo}</div>
            <div>{job.asset.serial || job.asset.customerAssetNo} · {job.asset.size}</div>
            <div>{job.quote ? `${job.quote.number} · ${job.quote.status.toLowerCase()}` : 'no quote yet'}</div>
            <div>{job.branch}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 26 }}>
          <ReportField label="Customer" value={job.customer} />
          <ReportField label="Site" value={job.site.split(' — ')[1] ?? job.site} />
          <ReportField label="Fleet / machine" value={job.asset.fleetNo ?? '—'} mono />
          <ReportField label="Category" value={job.category ?? '—'} />
        </div>

        <h3 style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 23, margin: '0 0 12px' }}>Stages</h3>
        <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse', marginBottom: 26 }}>
          <thead>
            <tr style={{ background: 'var(--td-ground-soft)' }}>
              <th style={thStyle(150)}>Stage</th>
              <th style={thStyle(158)}>When</th>
              <th style={thStyle()}>Who</th>
              <th style={thStyle()}>Recorded</th>
            </tr>
          </thead>
          <tbody>
            {recorded.map((e, i) => (
              <tr key={`${e.to}-${i}`}>
                <td style={tdStyle(true)}>{stages.find((s) => s.id === e.to)?.label ?? e.to}</td>
                <td style={{ ...tdStyle(), fontFamily: 'var(--td-mono)' }}>{e.at}</td>
                <td style={tdStyle()}>{e.by}</td>
                <td style={{ ...tdStyle(), fontSize: 13 }}>{e.payload ? Object.entries(e.payload).map(([k, v]) => `${k}: ${v}`).join(' · ') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3 style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 23, margin: '0 0 12px' }}>Photographs, by stage</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 26 }}>
          {job.photos.map((ph) => (
            <div key={ph.id}>
              <div style={{ height: 80, borderRadius: 6, background: '#2e353a' }} />
              <div style={{ fontFamily: 'var(--td-mono)', fontSize: 11, color: 'var(--td-ink-2)', marginTop: 5, lineHeight: 1.4 }}>
                {stages.find((s) => s.id === ph.stage)?.label ?? ph.stage}<br />{ph.capturedAt}
              </div>
            </div>
          ))}
          {job.photos.length === 0 && <div style={{ fontSize: 14, color: 'var(--td-ink-2)' }}>No photos recorded yet.</div>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
          <div>
            <h3 style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 23, margin: '0 0 12px' }}>Cook record</h3>
            {job.cookSeconds ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '7px 12px', fontSize: 15 }}>
                <span style={{ color: 'var(--td-ink-2)' }}>Target duration</span><span style={{ fontFamily: 'var(--td-mono)' }}>{fmtHms(job.cookSeconds)}</span>
                <span style={{ color: 'var(--td-ink-2)' }}>Remaining</span><span style={{ fontFamily: 'var(--td-mono)' }}>{fmtHms(job.cookRemaining ?? 0)}</span>
              </div>
            ) : <div style={{ fontSize: 15, color: 'var(--td-ink-2)' }}>Not cooked yet.</div>}
          </div>
          <div>
            <h3 style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 23, margin: '0 0 12px' }}>Quote history</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '7px 12px', fontSize: 15 }}>
              {job.quote?.history.map((h) => (
                <Fragment key={`${h.status}-${h.at}`}>
                  <span style={{ fontFamily: 'var(--td-mono)' }}>{h.status}</span>
                  <span>{h.at} · {h.by}{h.reason ? ` — ${h.reason}` : ''}</span>
                </Fragment>
              ))}
            </div>
            <div style={{ marginTop: 12, fontSize: 14, color: 'var(--td-ink-2)' }}>Quote numbers are raised in NetSuite by sales. No amounts are held here.</div>
          </div>
        </div>

        <div style={{ marginTop: 32, paddingTop: 14, borderTop: '1px solid var(--td-line-strong)', display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--td-mono)', fontSize: 12, color: 'var(--td-ink-3)' }}>
          <span>{job.jobNo} · assembled from the job file</span><span>Page 1 of 1</span>
        </div>
      </div>
    </main>
  );
}

function ReportField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--td-ink-3)' }}>{label}</div>
      <div style={{ fontFamily: mono ? 'var(--td-mono)' : undefined, fontSize: 16 }}>{value}</div>
    </div>
  );
}

function thStyle(width?: number): React.CSSProperties {
  return { textAlign: 'left', padding: '9px 10px', borderBottom: '2px solid var(--td-line-strong)', width };
}
function tdStyle(bold?: boolean): React.CSSProperties {
  return { padding: '9px 10px', borderBottom: '1px solid var(--td-line)', fontWeight: bold ? 600 : 400 };
}
