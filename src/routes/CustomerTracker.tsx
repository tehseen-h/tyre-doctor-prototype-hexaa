import { useParams, Link } from 'react-router-dom';
import { useAllJobs } from '../data/useStore';
import { TyreGlyph, RimGlyph } from '../components/Glyphs';
import { Card } from '../components/Card';
import type { Job } from '../types/domain';
import tyreDoctorLogoNavy from '../assets/tyre-doctor-logo-navy.svg';

const TOKEN_CUSTOMER: Record<string, { customer: string; site: string }> = {
  ridgeview: { customer: 'Kurrajong Coal', site: 'Ridgeview Pit' },
};

const TYRE_STEPS = ['Received', 'Being prepared', 'Cooking', 'Boxed up', 'Dispatched'];
const RIM_STEPS = ['Received', 'Being tested', 'Being repaired', 'Certified', 'Dispatched'];

function tyreStep(stage: string): number {
  if (stage === 'received' || stage === 'washed') return 0;
  if (stage === 'inspected' || stage === 'cut_out' || stage === 'repaired') return 1;
  if (stage === 'cooked') return 2;
  if (stage === 'final_quote_sent') return 3;
  if (stage === 'dispatched' || stage === 'closed') return 4;
  return -1; // not yet with us — not shown to the customer
}
function rimStep(stage: string): number {
  if (stage === 'rim_received' || stage === 'blasted') return 0;
  if (stage === 'ndt_tested') return 1;
  if (stage === 'rim_repaired' || stage === 'retested') return 2;
  if (stage === 'certified') return 3;
  if (stage === 'rim_dispatched' || stage === 'rim_closed') return 4;
  return -1;
}

function noteFor(job: Job, step: number): string {
  if (job.rail === 'tyre') {
    return [
      'With us since it was collected.',
      'Being prepared at Mackay.',
      'Cooking now. Expected back with you soon.',
      'Cooked and boxed up, waiting on the truck.',
      'On its way back to you.',
    ][step] ?? '';
  }
  return [
    'With us for crack testing.',
    'Crack testing this week. Your account manager has been updated.',
    'Being repaired, ahead of a re-test.',
    'Tested and painted. Paperwork issued.',
    'On its way back to you.',
  ][step] ?? '';
}

export function CustomerTracker() {
  const { token } = useParams();
  const ctx = TOKEN_CUSTOMER[token ?? ''] ?? TOKEN_CUSTOMER.ridgeview;
  const jobs = useAllJobs();

  const items = jobs
    .filter((j) => j.customer === ctx.customer)
    .map((j) => ({ job: j, step: j.rail === 'tyre' ? tyreStep(j.stage) : rimStep(j.stage) }))
    .filter((x) => x.step >= 0);

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(900px 420px at 50% -14%, rgba(13,100,173,.12), transparent 58%), var(--td-ground-soft)' }}>
      <header style={{ background: 'var(--td-paper)', borderBottom: '1px solid var(--td-line)' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '22px 28px', display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src={tyreDoctorLogoNavy} alt="Tyre Doctor" style={{ height: 30, width: 'auto' }} />
            <div style={{ fontSize: 15, color: 'var(--td-ink-2)' }}>Repair status for {ctx.customer}</div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{ctx.site}</div>
            <div style={{ fontSize: 15, color: 'var(--td-ink-2)' }}>Updated this morning</div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1120, margin: '0 auto', padding: '42px 28px 90px' }}>
        <div style={{ marginBottom: 30, animation: 'tdRise 400ms ease-out both' }}>
          <h1 style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 54, lineHeight: 1.02, margin: '0 0 12px' }}>Where your tyres and rims are</h1>
          <p style={{ fontSize: 19, color: 'var(--td-ink-2)', margin: 0, maxWidth: '44em' }}>
            {items.length} item{items.length === 1 ? ' is' : 's are'} with us at the moment. Anything certified has its paperwork attached below.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 20 }}>
          {items.map(({ job, step }) => {
            const labels = job.rail === 'rim' ? RIM_STEPS : TYRE_STEPS;
            const cooking = job.rail === 'tyre' && step === 2;
            const done = step >= 3;
            const stateColor = cooking ? 'var(--td-heat)' : done ? 'var(--td-pass)' : 'var(--td-blue)';
            const stateBg = cooking ? 'var(--td-heat-wash)' : done ? 'var(--td-pass-tint)' : 'var(--td-blue-tint)';
            const stateText = cooking ? 'var(--td-heat-deep)' : done ? 'var(--td-pass-deep)' : 'var(--td-blue-deep)';
            return (
              <Card key={job.jobNo} variant="hero" style={{ padding: '30px 24px', display: 'flex', flexDirection: 'column', gap: 18, animation: 'tdRise 420ms ease-out both' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  {job.rail === 'tyre' ? <TyreGlyph size={60} hot={cooking} /> : <RimGlyph size={60} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--td-ink-3)' }}>{job.rail === 'rim' ? 'Rim' : 'Tyre'}</div>
                    <div style={{ fontFamily: 'var(--td-mono)', fontWeight: 600, fontSize: 23, lineHeight: 1.15 }}>{job.rail === 'rim' ? job.asset.customerAssetNo : job.asset.serial}</div>
                    <div style={{ fontSize: 15, color: 'var(--td-ink-2)' }}>{job.asset.make ? `${job.asset.make} ` : ''}{job.asset.size} · {job.asset.fleetNo}</div>
                  </div>
                  <span style={{ border: `2px solid ${stateColor}`, background: stateBg, color: stateText, padding: '7px 14px', borderRadius: 999, fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 18, whiteSpace: 'nowrap' }}>
                    {labels[step]}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', alignItems: 'start' }}>
                  {labels.map((label, i) => (
                    <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9 }}>
                      <span style={{ height: 5, width: '100%', background: i <= step ? (cooking && i === step ? 'var(--td-heat)' : 'var(--td-blue)') : 'var(--td-line)', display: 'block', borderRadius: 3 }} />
                      <span style={{
                        width: i === step ? 20 : 14, height: i === step ? 20 : 14, borderRadius: '50%', marginTop: -16,
                        background: i < step ? 'var(--td-blue)' : i === step ? (cooking ? 'var(--td-heat)' : 'var(--td-blue)') : 'var(--td-paper)',
                        border: `3px solid ${i <= step ? (cooking && i === step ? 'var(--td-heat-deep)' : 'var(--td-blue-deep)') : 'var(--td-line-strong)'}`,
                      }}
                      />
                      <span style={{ fontFamily: 'var(--td-display)', fontWeight: 600, fontSize: 16, color: i <= step ? 'var(--td-ink)' : 'var(--td-ink-3)', textAlign: 'center', lineHeight: 1.15 }}>{label}</span>
                    </div>
                  ))}
                </div>

                <div style={{ fontSize: 16, color: 'var(--td-ink-2)', lineHeight: 1.45 }}>{noteFor(job, step)}</div>

                {job.certificates && job.certificates.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--td-line)', paddingTop: 16 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--td-ink-3)', marginBottom: 10 }}>Certificates</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {job.certificates.map((c) => (
                        <div key={c.number} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', border: '1px solid rgba(31,138,77,.4)', borderRadius: 'var(--td-r-md)', background: 'var(--td-pass-tint)' }}>
                          <span style={{ width: 34, height: 44, flex: 'none', background: '#fff', border: '1px solid var(--td-pass)', borderRadius: 3, boxShadow: '0 2px 6px rgba(17,28,36,.14)' }} />
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ display: 'block', fontSize: 17, fontWeight: 600 }}>{c.kind === 'ndt' ? 'Rim NDT certificate' : 'Rim repair certificate'}</span>
                            <span style={{ display: 'block', fontFamily: 'var(--td-mono)', fontSize: 14, color: 'var(--td-pass-deep)' }}>{c.number}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 16, color: 'var(--td-ink-2)', marginTop: 12 }}>
                      The next test falls due at <span style={{ fontFamily: 'var(--td-mono)', fontWeight: 600 }}>{(job.certificates[0].nextNdtDueHours ?? 0).toLocaleString()} h</span> on this rim.
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
          {items.length === 0 && <div style={{ fontSize: 17, color: 'var(--td-ink-2)' }}>Nothing with us right now.</div>}
        </div>

        <Card style={{ marginTop: 34, padding: 26 }}>
          <h2 style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 27, margin: '0 0 8px' }}>Questions about a repair?</h2>
          <p style={{ fontSize: 17, color: 'var(--td-ink-2)', margin: 0, maxWidth: '54em' }}>
            Quote your job number or the tyre serial, and your Tyre Doctor contact can open the same file you are looking at. Quotes and invoicing are handled by your account manager as usual.
          </p>
        </Card>

        <div style={{ marginTop: 28, fontSize: 15, color: 'var(--td-ink-3)' }}>
          The workshop uses an internal view of this same data. <Link to="/console">Return to the workshop tool</Link>.
        </div>
      </main>
    </div>
  );
}
