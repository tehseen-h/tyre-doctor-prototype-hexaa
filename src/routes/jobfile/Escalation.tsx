import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useJob } from '../../data/useStore';
import { useAppState } from '../../app/AppState';
import { store } from '../../data/store';
import { categoryFor, RULES } from '../../config/rules';
import { HazardHeader } from '../../components/HazardBand';
import { Button } from '../../components/Button';
import { EvidenceTile } from '../../components/EvidenceTile';
import { useRevealAnnouncer } from '../../components/useRevealAnnouncer';
import { atLabel } from '../../data/format';
import { HeaderSlot } from '../../layout/HeaderSlot';
import type { EmailPreview } from '../../types/domain';

export function Escalation() {
  const { jobNo } = useParams();
  const job = useJob(jobNo);
  const { role } = useAppState();
  const navigate = useNavigate();
  const [measuredMm, setMeasuredMm] = useState(String(job?.damageSizeMm ?? ''));
  const [beltPly, setBeltPly] = useState(!!job?.beltPlyDamage);
  const [reason, setReason] = useState('');
  const [sentEmail, setSentEmail] = useState<EmailPreview | null>(null);
  const { reveal, liveRegion } = useRevealAnnouncer();
  const emailRef = useRef<HTMLDivElement | null>(null);

  const headerMiddle = <span style={{ marginLeft: 'auto', fontFamily: 'var(--td-mono)', fontSize: 15 }}>{jobNo}</span>;

  if (!job) return null;

  const back = () => navigate(`/jobs/${job.jobNo}`);
  const quotedCategory = job.quotedCategory ?? job.category;
  const measuredCategory = categoryFor(Number(measuredMm) || 0, beltPly, job.damagePosition);

  if (job.paused && !sentEmail) {
    return (
      <main style={{ maxWidth: 1240, margin: '0 auto', padding: '22px 24px 90px' }}>
        <div style={{ borderRadius: 'var(--td-r-lg)', overflow: 'hidden', border: '2px solid var(--td-hazard)', boxShadow: 'var(--td-card)', background: 'var(--td-paper)' }}>
          <HazardHeader label={`Worse than quoted · ${job.jobNo}`} right={<Button variant="secondary" onClick={back}>Back to the job</Button>} />
          <div style={{ padding: 26 }}>
            <h1 style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 42, lineHeight: 1.03, margin: '0 0 8px' }}>This tyre is worse than what was quoted.</h1>
            <p style={{ fontSize: 18, color: 'var(--td-ink-2)', margin: '0 0 24px', maxWidth: '58em' }}>
              Sales has been told, and this tyre is paused until a revised quote goes out. The rest of the batch keeps moving.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 18, marginBottom: 24 }}>
              <div style={{ border: '2px solid var(--td-fail)', borderRadius: 'var(--td-r-md)', background: 'var(--td-fail-tint)', padding: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--td-fail-deep)', marginBottom: 10 }}>Measured at inspection</div>
                <div style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 38, lineHeight: 1, marginBottom: 12, color: 'var(--td-fail-deep)' }}>{job.category}</div>
                <div style={{ display: 'flex', gap: 24, marginBottom: 10 }}>
                  <div><div style={{ fontFamily: 'var(--td-mono)', fontSize: 27, fontWeight: 600 }}>{job.damageSizeMm} mm</div><div style={{ fontSize: 14, color: 'var(--td-ink-2)' }}>damage size</div></div>
                  <div><div style={{ fontFamily: 'var(--td-mono)', fontSize: 27, fontWeight: 600 }}>{job.beltPlyDamage ? 'yes' : 'no'}</div><div style={{ fontSize: 14, color: 'var(--td-ink-2)' }}>belt / ply damage</div></div>
                </div>
                <div style={{ fontSize: 16, color: 'var(--td-ink-2)', lineHeight: 1.5 }}>{job.pauseReason}</div>
              </div>
              <div style={{ border: '1px solid rgba(245,163,0,.5)', borderRadius: 'var(--td-r-md)', background: 'var(--td-hazard-tint)', padding: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--td-hazard-deep)', marginBottom: 12 }}>The evidence</div>
                <div style={{ display: 'flex', gap: 14 }}>
                  <EvidenceTile kind="damage" at="inspection" by={job.customer} stageLabel="Inspected" where={job.branch} width={140} height={106} />
                  <div style={{ fontSize: 15, color: 'var(--td-hazard-ink)', lineHeight: 1.5 }}>Attached to the inspection stage. It travels with the notification, so sales sees what the repairer saw.</div>
                </div>
              </div>
            </div>
            <Button variant="hazard" onClick={() => { store.resolveEscalation(job.jobNo, { by: role.label }); back(); }}>
              Mark revised quote sent — un-pause this tyre
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const blocked = !reason.trim();

  return (
    <main style={{ maxWidth: 1240, margin: '0 auto', padding: '22px 24px 90px' }}>
      <HeaderSlot middle={headerMiddle} />
      <div style={{ borderRadius: 'var(--td-r-lg)', overflow: 'hidden', border: '2px solid var(--td-hazard)', boxShadow: 'var(--td-card)', background: 'var(--td-paper)' }}>
        <HazardHeader label={`Flag worse than quoted · ${job.jobNo}`} right={<Button variant="secondary" onClick={back}>Back to the job</Button>} />
        <div style={{ padding: 26 }}>
          <h1 style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 42, lineHeight: 1.03, margin: '0 0 8px' }}>Is this tyre worse than what was quoted?</h1>
          <p style={{ fontSize: 18, color: 'var(--td-ink-2)', margin: '0 0 24px', maxWidth: '58em' }}>
            Measure what you found. If it moves the category up, sales is told and this one tyre pauses — the rest of the batch keeps moving.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 24 }}>
            <div style={{ border: '1px solid var(--td-line)', borderRadius: 'var(--td-r-md)', background: 'var(--td-ground-soft)', padding: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--td-ink-3)', marginBottom: 10 }}>As quoted</div>
              <div style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 38, lineHeight: 1, marginBottom: 10 }}>{quotedCategory}</div>
              <div style={{ fontSize: 16, color: 'var(--td-ink-2)', lineHeight: 1.5 }}>Quote {job.quote?.number} — status {job.quote?.status}.</div>
            </div>
            <div style={{ border: measuredCategory !== job.category ? '2px solid var(--td-fail)' : '1px solid var(--td-line)', borderRadius: 'var(--td-r-md)', background: measuredCategory !== job.category ? 'var(--td-fail-tint)' : 'var(--td-ground-soft)', padding: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: measuredCategory !== job.category ? 'var(--td-fail-deep)' : 'var(--td-ink-3)', marginBottom: 12 }}>Measured just now</div>
              <div style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 38, lineHeight: 1, marginBottom: 12, color: measuredCategory !== job.category ? 'var(--td-fail-deep)' : undefined }}>{measuredCategory}</div>
              <label style={{ display: 'flex', gap: 16, alignItems: 'flex-end', marginBottom: 10 }}>
                <span>
                  <span style={{ display: 'block', fontSize: 14, color: 'var(--td-ink-2)', marginBottom: 4 }}>Damage size (mm)</span>
                  <input value={measuredMm} onChange={(e) => setMeasuredMm(e.target.value.replace(/[^0-9]/g, ''))} style={{ border: '1px solid var(--td-line-strong)', borderRadius: 'var(--td-r-sm)', fontFamily: 'var(--td-mono)', fontSize: 20, padding: 10, width: 100 }} />
                </span>
                <Button variant={beltPly ? 'primary' : 'secondary'} onClick={() => setBeltPly((v) => !v)}>Belt/ply: {beltPly ? 'yes' : 'no'}</Button>
              </label>
            </div>
          </div>

          <div style={{ border: '1px solid var(--td-line)', borderRadius: 'var(--td-r-md)', background: 'var(--td-ground-soft)', padding: 20, marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 16 }}>
              <span style={{ display: 'block', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Reason — required, and it goes in the email</span>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                style={{ border: '1px solid var(--td-line-strong)', borderRadius: 'var(--td-r-sm)', background: 'var(--td-paper)', color: 'var(--td-ink)', width: '100%', fontSize: 16, padding: 13, resize: 'vertical' }}
              />
            </label>
            {blocked && (
              <div style={{ borderLeft: '5px solid var(--td-fail)', background: 'var(--td-fail-tint)', borderRadius: 'var(--td-r-sm)', padding: '13px 16px', fontSize: 16, color: 'var(--td-fail-deep)', marginBottom: 16 }}>
                A reason is required — sales cannot revise a quote without one.
              </div>
            )}
            <Button
              variant="hazard"
              disabled={blocked || !!sentEmail}
              onClick={() => {
                store.escalate(job.jobNo, {
                  reason: reason.trim(), by: role.label, newCategory: measuredCategory,
                });
                const email: EmailPreview = {
                  to: 'sales@tyredoctor', from: `TD One — ${job.branch}`,
                  subject: `Worse than quoted — ${job.jobNo} (${job.asset.serial}) now ${measuredCategory}`,
                  lines: [
                    `Inspected at ${job.branch} by ${role.label}, ${atLabel()}.`,
                    `Quoted ${quotedCategory}. ${reason.trim()}`,
                    `Quote no. (from NetSuite): ${job.quote?.number ?? 'not yet raised'} — needs revising.`,
                    'This tyre is paused. The rest of the batch keeps moving.',
                  ],
                };
                setSentEmail(email);
                setTimeout(() => reveal(emailRef.current, `Sent to sales. ${job.jobNo} is paused.`), 80);
              }}
            >
              Send to sales and pause this tyre
            </Button>
          </div>
          <div style={{ fontSize: 15, color: 'var(--td-ink-2)' }} title={RULES.escalation.source}>{RULES.escalation.label} · {atLabel()}</div>

          {sentEmail && (
            <div ref={emailRef} style={{ marginTop: 24, border: '2px solid var(--td-hazard)', borderRadius: 'var(--td-r-lg)', background: 'var(--td-paper)', boxShadow: 'var(--td-card)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 22px', background: 'var(--td-hazard-tint)', borderBottom: '1px solid rgba(245,163,0,.4)' }}>
                <span style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 22 }}>What sales gets told</span>
              </div>
              <div style={{ padding: 22 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '76px 1fr', gap: '9px 14px', fontSize: 16, marginBottom: 18 }}>
                  <span style={{ color: 'var(--td-ink-3)' }}>To</span><span style={{ fontFamily: 'var(--td-mono)', fontSize: 15 }}>{sentEmail.to}</span>
                  <span style={{ color: 'var(--td-ink-3)' }}>From</span><span style={{ fontFamily: 'var(--td-mono)', fontSize: 15 }}>{sentEmail.from}</span>
                  <span style={{ color: 'var(--td-ink-3)' }}>Subject</span><span style={{ fontWeight: 600 }}>{sentEmail.subject}</span>
                </div>
                <div style={{ borderTop: '1px solid var(--td-line)', paddingTop: 18, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 16, lineHeight: 1.5 }}>
                  {sentEmail.lines.map((line) => <div key={line}>{line}</div>)}
                </div>
                <div style={{ marginTop: 20 }}>
                  <Button variant="primary" onClick={back}>Back to the job</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {liveRegion}
    </main>
  );
}
