import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useJob } from '../../data/useStore';
import { useAppState } from '../../app/AppState';
import { store, Store } from '../../data/store';
import { railStages, stageIndex, stageById } from '../../config/stages';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { TyreGlyph } from '../../components/Glyphs';
import { EvidenceTile } from '../../components/EvidenceTile';
import { Toast, useToast } from '../../components/Toast';
import { useTour, TourOverlay } from '../../components/Tour';
import { HeaderSlot } from '../../layout/HeaderSlot';
import { useRevealAnnouncer } from '../../components/useRevealAnnouncer';
import { StageDrawer } from './StageDrawer';
import { fmtHms } from '../../data/format';
import type { Photo } from '../../types/domain';

export function JobFile() {
  const { jobNo } = useParams();
  const job = useJob(jobNo);
  const navigate = useNavigate();
  const { role } = useAppState();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { toast, show, dismiss } = useToast();
  const lastAdvanced = useRef(false);
  const confirmedStageRef = useRef<string>('');
  const toastMessageRef = useRef('');
  const { reveal, liveRegion } = useRevealAnnouncer();

  const spineRef = useRef<HTMLDivElement | null>(null);

  const tour = useTour([
    { ref: 'header', text: 'Everything that identifies this tyre is in one band — serial, quote number, machine and stage.' },
    { ref: 'advance', text: 'One big action per screen. On the floor, this is the only button that matters.' },
    { ref: 'quote', text: 'The quote status and its history sit right here, including any revision.' },
    { ref: 'spine', text: 'The whole story, stage by stage, with every photo attached to the step it came from.' },
  ]);

  const headerMiddle = <span style={{ marginLeft: 'auto', fontFamily: 'var(--td-mono)', fontSize: 15, whiteSpace: 'nowrap' }}>{jobNo}</span>;
  const headerRight = <Button variant="steel-ghost" onClick={tour.start}>Show me around</Button>;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (drawerOpen) { setDrawerOpen(false); return; }
      tour.end();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerOpen]);

  if (!job) {
    return (
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '60px 24px' }}>
        <HeaderSlot middle={headerMiddle} />
        <h1 style={{ fontFamily: 'var(--td-display)' }}>Job not found</h1>
        <Link to="/console">← Back to the floor</Link>
      </main>
    );
  }

  const stages = railStages(job.rail);
  const currentIndex = stageIndex(job.rail, job.stage);
  const stageDef = stageById(job.stage);

  const resolveEscalation = () => {
    store.resolveEscalation(job.jobNo, { by: role.label });
    show('Revised quote sent — this tyre is un-paused.', false);
  };

  const undo = () => {
    dismiss();
    store.undoLast(job.jobNo);
  };

  return (
    <main style={{ maxWidth: 1520, margin: '0 auto', padding: '22px 24px 90px' }}>
      <HeaderSlot middle={headerMiddle} right={headerRight} />
      <div ref={tour.setRef('header')}>
        <Card variant="hero" style={{ padding: '30px 24px', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 30, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <TyreGlyph size={74} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--td-ink-3)' }}>{job.rail === 'tyre' ? 'Tyre repair — job file' : 'Rim NDT — job file'}</div>
                <h1 style={{ fontFamily: 'var(--td-mono)', fontWeight: 600, fontSize: 31, lineHeight: 1.1, margin: '2px 0 5px' }}>{job.jobNo}</h1>
                <div style={{ fontSize: 16, color: 'var(--td-ink-2)' }}>{job.site}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,auto)', gap: '18px 34px' }}>
              <Field label="Tyre serial" value={job.asset.serial} mono />
              <Field label="Make and size" value={`${job.asset.make ?? ''} ${job.asset.size ?? ''}`} />
              <Field label="Quote no. (from NetSuite)" value={job.quote?.number ?? '—'} mono />
              <Field label="Branch" value={`${job.branch}`} />
              <Field label="Fleet / machine" value={job.asset.fleetNo ?? '—'} mono />
              <Field label="Repair category" value={job.category ?? '—'} bold />
              <Field label="Site visit" value={job.visitNo ?? '—'} mono />
              <Field label="Stage" value={`${stageDef?.label ?? job.stage} — ${currentIndex + 1} of ${stages.length}`} bold />
            </div>

            {job.stage === 'cooked' && (
              <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--td-steel)', color: '#fff', padding: '11px 18px', borderRadius: 'var(--td-r-md)' }}>
                  <span style={{ width: 11, height: 11, borderRadius: '50%', background: 'var(--td-heat)', boxShadow: '0 0 10px var(--td-heat)' }} />
                  <span style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 22 }}>In the oven</span>
                  <span style={{ fontFamily: 'var(--td-mono)', fontSize: 19, fontVariantNumeric: 'tabular-nums' }}>{fmtHms(job.cookRemaining ?? 0)}</span>
                </div>
              </div>
            )}
          </div>

          {job.paused && (
            <div style={{ marginTop: 18, border: '2px solid var(--td-hazard)', background: 'var(--td-hazard-tint)', borderRadius: 'var(--td-r-md)', padding: 16, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 16, color: 'var(--td-hazard-ink)', flex: 1, minWidth: 240 }}>
                <strong>Paused — waiting on a revised quote.</strong> {job.pauseReason}
              </div>
              <Button variant="hazard" onClick={resolveEscalation}>Mark revised quote sent — un-pause</Button>
            </div>
          )}

          <div className="no-print" style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--td-line)' }}>
            <Button ref={tour.setRef('advance') as React.Ref<HTMLButtonElement>} variant="primary" size="xl" onClick={() => setDrawerOpen(true)} disabled={!!job.paused}>
              Advance this tyre <span style={{ fontSize: 22, lineHeight: 1 }}>→</span>
            </Button>
            {(job.stage === 'inspected' || job.stage === 'cut_out') && (
              <Button variant="secondary" size="lg" onClick={() => navigate(`/jobs/${job.jobNo}/escalation`)}>Flag worse than quoted</Button>
            )}
            <Button variant="secondary" size="lg" onClick={() => navigate(`/jobs/${job.jobNo}/report`)}>Build the job report</Button>
            <Link to={`/t/${job.site.split(' — ')[0].toLowerCase().replace(/\s+/g, '-')}`} style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--td-blue)', fontSize: 16, fontWeight: 600, padding: '14px 8px', textDecoration: 'none' }}>
              See what the customer sees
            </Link>
          </div>
        </Card>
      </div>

      {job.quote && (
        <div ref={tour.setRef('quote')}>
          <Card style={{ padding: '22px 24px', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
              <h2 style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 28, margin: 0 }}>What happened to the quote</h2>
              <span style={{ fontSize: 16, color: 'var(--td-ink-2)' }}><span style={{ fontFamily: 'var(--td-mono)' }}>{job.quote.number}</span> — raised in NetSuite by sales</span>
              <span
                title="Quote statuses run Initial → Revised → Final. Source: the client's own words. TD One holds the number and the status only, never an amount."
                style={{ marginLeft: 'auto', background: 'var(--td-blue-tint)', color: 'var(--td-blue-deep)', borderRadius: 999, padding: '5px 13px', fontSize: 14, fontWeight: 600, cursor: 'help' }}
              >
                Where these statuses come from
              </span>
            </div>
            <QuoteRibbon history={job.quote.history} status={job.quote.status} />
          </Card>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 18, alignItems: 'start' }}>
        <div ref={(el) => { spineRef.current = el; tour.setRef('spine')(el); }}>
          <Card style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 22, flexWrap: 'wrap' }}>
              <h2 style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 28, margin: 0 }}>The story of this repair</h2>
              <span style={{ fontSize: 16, color: 'var(--td-ink-2)' }}>every photo sits with the stage it came from</span>
            </div>
            <EvidenceSpine job={job} stages={stages} currentIndex={currentIndex} />
          </Card>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {job.stage === 'cooked' && <CookRecordCard job={job} />}
          {job.rail === 'tyre' && (job.damageSizeMm !== undefined || job.category) && <MeasuredCard job={job} />}
          {job.asset.history && job.asset.history.length > 0 && <CasingHistoryCard job={job} />}
        </div>
      </div>

      {drawerOpen && (
        <StageDrawer
          job={job}
          onClose={() => {
            setDrawerOpen(false);
            if (lastAdvanced.current) {
              lastAdvanced.current = false;
              const confirmedStage = confirmedStageRef.current;
              setTimeout(() => {
                const el = spineRef.current?.querySelector<HTMLElement>(`[data-stage="${confirmedStage}"]`);
                reveal(el ?? null, toastMessageRef.current);
              }, 80);
            }
          }}
          onConfirmed={(msg) => {
            lastAdvanced.current = true;
            confirmedStageRef.current = job.stage;
            toastMessageRef.current = msg;
            show(msg, true);
          }}
        />
      )}
      <Toast toast={toast} onUndo={undo} onDismiss={dismiss} />
      {tour.active && <TourOverlay step={tour.step} rect={tour.rect} total={tour.total} text={tour.text} onNext={tour.next} onEnd={tour.end} />}
      {liveRegion}
    </main>
  );
}

function Field({
  label, value, mono, bold,
}: { label: string; value: string; mono?: boolean; bold?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--td-ink-3)' }}>{label}</div>
      <div style={{ fontFamily: mono ? 'var(--td-mono)' : undefined, fontSize: mono ? 18 : 17, fontWeight: mono || bold ? 600 : 400 }}>{value}</div>
    </div>
  );
}

function QuoteRibbon({ history, status }: { history: { status: string; at: string; by: string; reason?: string; photoId?: string }[]; status: string }) {
  const steps = ['Initial', 'Revised', 'Final'];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr 1fr', gap: 16, alignItems: 'stretch' }}>
      {steps.map((s, i) => {
        const entry = history.find((h) => h.status === s);
        const isCurrent = s === status && !!entry;
        const done = !!entry;
        if (!done) {
          return (
            <div key={s} style={{ border: '1px dashed var(--td-line-strong)', background: 'var(--td-ground-soft)', borderRadius: 'var(--td-r-md)', padding: 18 }}>
              <Badge>{i + 1} · {s}</Badge>
              <div style={{ fontFamily: 'var(--td-display)', fontWeight: 600, fontSize: 24, margin: '10px 0 4px', color: 'var(--td-ink-2)' }}>Not sent yet</div>
              <div style={{ fontSize: 15, color: 'var(--td-ink-3)' }}>Waiting on an earlier stage.</div>
            </div>
          );
        }
        return (
          <div
            key={s}
            style={{
              border: isCurrent && s === 'Revised' ? '2px solid var(--td-hazard)' : '1px solid rgba(31,138,77,.4)',
              background: isCurrent && s === 'Revised' ? 'var(--td-hazard-tint)' : 'var(--td-pass-tint)',
              borderRadius: 'var(--td-r-md)', padding: 18, display: 'flex', gap: 18,
            }}
          >
            <div style={{ flex: 1 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, background: isCurrent && s === 'Revised' ? 'var(--td-hazard)' : 'var(--td-pass)',
                color: isCurrent && s === 'Revised' ? 'var(--td-hazard-ink)' : '#fff', borderRadius: 999, padding: '4px 12px', fontSize: 14, fontWeight: 700, marginBottom: 10,
              }}
              >
                {i + 1} · {s}{entry.reason ? ' — and this is why' : ''}
              </span>
              <div style={{ fontFamily: 'var(--td-display)', fontWeight: 600, fontSize: 24, marginBottom: 4 }}>{entry.reason ?? (s === 'Initial' ? 'Sent to the mine' : `Quote ${s.toLowerCase()}`)}</div>
              <div style={{ fontFamily: 'var(--td-mono)', fontSize: 15, color: 'var(--td-ink-2)' }}>{entry.at}</div>
              <div style={{ fontSize: 15, color: 'var(--td-ink-2)', marginTop: 8 }}>{entry.by}</div>
            </div>
            {entry.photoId && (
              <div style={{ width: 132, flex: 'none' }}>
                <EvidenceTile kind="damage" at={entry.at.split(' · ')[1] ?? entry.at} by={entry.by.split(' (')[0]} stageLabel="Inspected" where="Mackay" width={132} height={100} />
                <div style={{ fontSize: 13, color: 'var(--td-hazard-deep)', fontWeight: 600, marginTop: 6, lineHeight: 1.3 }}>The photo that changed the quote</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--td-paper)', border: '1px solid var(--td-line-strong)', color: 'var(--td-ink-2)', borderRadius: 999, padding: '4px 12px', fontSize: 14, fontWeight: 700 }}>
      {children}
    </div>
  );
}

const PHOTO_KIND_BY_STAGE: Record<string, Photo['kind']> = {
  triaged: 'serial_plate', washed: 'whole_tyre', inspected: 'damage', cut_out: 'cavity', repaired: 'repair',
};

function EvidenceSpine({ job, stages, currentIndex }: { job: ReturnType<typeof useJob>; stages: ReturnType<typeof railStages>; currentIndex: number }) {
  if (!job) return null;
  return (
    <div>
      {stages.map((st, i) => {
        const past = i < currentIndex;
        const current = i === currentIndex;
        const future = i > currentIndex;
        const event = job.events.find((e) => e.to === st.id && !e.payload?.action);
        const photos = job.photos.filter((p) => p.stage === st.id);
        return (
          <div key={st.id} data-stage={st.id} style={{ display: 'grid', gridTemplateColumns: '30px 1fr', gap: 18 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{
                width: current ? 22 : 16, height: current ? 22 : 16, borderRadius: '50%', flex: 'none',
                background: future ? 'var(--td-paper)' : current ? 'var(--td-heat)' : 'var(--td-blue)',
                border: `3px solid ${future ? 'var(--td-line-strong)' : current ? 'var(--td-heat-deep)' : 'var(--td-blue)'}`,
                boxShadow: current ? '0 0 0 6px rgba(210,84,44,.18)' : 'none',
              }}
              />
              <span style={{ flex: 1, width: 3, borderRadius: 2, background: future ? 'var(--td-line)' : 'var(--td-blue-tint)', minHeight: 20 }} />
            </div>
            <div style={{ paddingBottom: 22 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 23, lineHeight: 1, color: future ? 'var(--td-ink-3)' : 'var(--td-ink)' }}>{st.label}</span>
                {event && <span style={{ fontFamily: 'var(--td-mono)', fontSize: 15, color: 'var(--td-ink-3)' }}>{event.at}</span>}
                {event && <span style={{ fontSize: 16, color: 'var(--td-ink-2)' }}>{event.by}</span>}
                {current && <span style={{ background: 'var(--td-heat-deep)', color: '#fff', borderRadius: 999, padding: '3px 12px', fontSize: 14, fontWeight: 700 }}>happening now</span>}
              </div>
              {event?.payload && Object.keys(event.payload).length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginTop: 10 }}>
                  {Object.entries(event.payload).map(([k, v]) => (
                    <span key={k} style={{ fontSize: 15, background: 'var(--td-ground-soft)', border: '1px solid var(--td-line)', borderRadius: 999, padding: '4px 13px' }}>{k}: {String(v)}</span>
                  ))}
                </div>
              )}
              {photos.length > 0 && (
                <div style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
                  {photos.map((p) => (
                    <EvidenceTile key={p.id} kind={p.kind} at={p.capturedAt.split(' · ')[1] ?? p.capturedAt} by={p.capturedBy} stageLabel={st.label} where={p.where} note={p.note} serial={job.asset.serial} size={job.asset.size} make={job.asset.make} width={150} height={112} queued={p.queued} />
                  ))}
                </div>
              )}
              {future && <div style={{ fontSize: 15, color: 'var(--td-ink-3)', marginTop: 5 }}>{st.captures.join(' · ') || 'Comes later in the rail.'}</div>}
              {past && photos.length === 0 && !event?.payload && (
                <div style={{ fontSize: 15, color: 'var(--td-ink-3)', marginTop: 5 }}>Confirmed — no additional capture recorded.</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CookRecordCard({ job }: { job: NonNullable<ReturnType<typeof useJob>> }) {
  const remaining = job.cookRemaining ?? 0;
  const target = job.cookSeconds ?? 1;
  const pct = Math.round(((target - remaining) / target) * 100);
  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--td-r-lg)', background: 'radial-gradient(120% 92% at 50% 128%, rgba(210,84,44,.7), transparent 62%),var(--td-steel)', color: '#fff', boxShadow: 'var(--td-card)', padding: 22 }}>
      <div aria-hidden style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 90, background: 'linear-gradient(0deg,rgba(210,84,44,.6),transparent)', animation: 'tdHeat 3.4s ease-in-out infinite' }} />
      <div style={{ position: 'relative' }}>
        <div style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 27, lineHeight: 1 }}>Cook record</div>
        <div style={{ fontSize: 15, color: 'var(--td-heat-wash)', marginTop: 5, marginBottom: 16 }}>Hot vulcanising, in progress</div>
        <div style={{ fontFamily: 'var(--td-mono)', fontSize: 46, fontWeight: 600, lineHeight: 1, fontVariantNumeric: 'tabular-nums', marginBottom: 12 }}>{fmtHms(remaining)}</div>
        <div style={{ height: 7, borderRadius: 4, background: 'rgba(246,193,166,.26)', overflow: 'hidden', marginBottom: 14 }}>
          <div style={{ height: 7, borderRadius: 4, background: 'var(--td-heat-wash)', width: `${pct}%` }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, fontSize: 15, color: 'var(--td-heat-wash)' }}>
          <span>Target {fmtHms(target)}</span><span>{fmtHms(target - remaining)} elapsed</span>
        </div>
      </div>
    </div>
  );
}

function MeasuredCard({ job }: { job: NonNullable<ReturnType<typeof useJob>> }) {
  return (
    <Card variant="reduced" style={{ padding: '28px 20px 20px' }}>
      <h2 style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 25, margin: '0 0 14px' }}>What we measured</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        <Row label="Damage position" value={job.damagePosition ?? '—'} />
        <Row label="Damage size" value={job.damageSizeMm !== undefined ? `${job.damageSizeMm} mm` : '—'} mono />
        <Row label="Belt or ply damage" value={job.beltPlyDamage ? 'Yes' : 'No'} />
        {job.repairUnit && <Row label="Repair unit" value={job.repairUnit} />}
        <Row label="Category" value={job.category ?? '—'} bold />
      </div>
      <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--td-line)' }}>
        <span
          title="Thresholds in use: Minor is 50 mm or less with no belt or ply damage; Intermediate is 50–150 mm or a single ply; Major is over 150 mm, multi-ply, sidewall or bead, or any section repair. Source: our own judgement, aligned to Tire Industry Association section-repair terminology — adjustable, and we expect the client to correct it."
          style={{ fontSize: 15, color: 'var(--td-blue-deep)', fontWeight: 600, borderBottom: '1px dotted var(--td-blue)', cursor: 'help' }}
        >
          Why this counts as a {job.category}
        </span>
      </div>
    </Card>
  );
}

function Row({
  label, value, mono, bold,
}: { label: string; value: string; mono?: boolean; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ fontSize: 16, color: 'var(--td-ink-2)' }}>{label}</span>
      <span style={{ fontFamily: mono ? 'var(--td-mono)' : undefined, fontSize: mono ? 19 : 17, fontWeight: mono || bold ? 600 : 400, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  );
}

function CasingHistoryCard({ job }: { job: NonNullable<ReturnType<typeof useJob>> }) {
  return (
    <Card variant="reduced" style={{ padding: '28px 20px 20px' }}>
      <h2 style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 25, margin: '0 0 4px' }}>This casing before</h2>
      <div style={{ fontSize: 15, color: 'var(--td-ink-3)', marginBottom: 12 }}>Serial <span style={{ fontFamily: 'var(--td-mono)' }}>{job.asset.serial}</span> — {job.asset.history!.length} previous job{job.asset.history!.length === 1 ? '' : 's'}</div>
      {job.asset.history!.map((h) => (
        <Link key={h.jobNo} to={`/jobs/${h.jobNo}`} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0', borderTop: '1px solid var(--td-line)', textDecoration: 'none', color: 'inherit' }}>
          <span style={{ fontFamily: 'var(--td-mono)', fontSize: 15, fontWeight: 600, width: 146 }}>{h.jobNo}</span>
          <span style={{ fontFamily: 'var(--td-mono)', fontSize: 15, color: 'var(--td-ink-3)', width: 74 }}>{h.date}</span>
          <span style={{ fontSize: 16, flex: 1 }}>{h.outcome}</span>
          <span style={{ fontSize: 18, color: 'var(--td-blue)' }}>→</span>
        </Link>
      ))}
      <div style={{ borderTop: '1px solid var(--td-line)', paddingTop: 12, marginTop: 2, fontSize: 15, color: 'var(--td-ink-2)' }}>
        {job.asset.history!.length > 0 ? `${job.asset.history!.length + 1} repair${job.asset.history!.length ? 's' : ''} on this casing.` : 'First repair recorded on this casing.'}
      </div>
    </Card>
  );
}
