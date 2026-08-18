import {
  useEffect, useMemo, useRef, useState,
} from 'react';
import { Link } from 'react-router-dom';
import { useAppState } from '../app/AppState';
import { useBranchJobs } from '../data/useStore';
import { useIntakeState } from '../data/intakeState';
import { store } from '../data/store';
import { BRANCHES, EMAILS } from '../data/fixtures';
import { stageById } from '../config/stages';
import type { Job, EmailPreview } from '../types/domain';
import { HeaderSlot } from '../layout/HeaderSlot';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { TyreGlyph, RimGlyph } from '../components/Glyphs';
import { HazardHeader } from '../components/HazardBand';
import { RimHourDial } from '../components/RimHourDial';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { Toast, useToast } from '../components/Toast';
import { EmailModal } from '../components/EmailModal';
import { useTour, TourOverlay } from '../components/Tour';
import { fmtHms } from '../data/format';

const TYRE_BAYS = [
  { id: 'on_the_way', label: 'On the way', kicker: 'Triaged, quoted or on a truck' },
  { id: 'wash', label: 'Wash bay', kicker: 'Received and washed' },
  { id: 'inspect', label: 'Inspect', kicker: 'Measure and categorise' },
  { id: 'cut_out', label: 'Cut out', kicker: 'Cavity opened' },
  { id: 'fill', label: 'Fill and repair', kicker: 'Rubber going in' },
];
const RIM_BAYS = [
  { id: 'rim_blast', label: 'Blast booth', kicker: 'Received and blasted' },
  { id: 'rim_ndt', label: 'Crack testing', kicker: 'Tested, repaired, re-tested' },
  { id: 'rim_btp', label: 'Blast, test, paint', kicker: 'The clean-rim path' },
];

function bayOf(job: Job): string | null {
  if (job.rail === 'rim') {
    if (job.stage === 'rim_received' || job.stage === 'blasted') return 'rim_blast';
    if (job.stage === 'btp') return 'rim_btp';
    if (job.stage === 'certified') return 'ready';
    if (job.stage === 'ndt_tested' || job.stage === 'rim_repaired' || job.stage === 'retested') return 'rim_ndt';
    return null;
  }
  const map: Record<string, string> = {
    triaged: 'on_the_way', initial_quote_sent: 'on_the_way', collected: 'on_the_way',
    received: 'wash', washed: 'wash', inspected: 'inspect', cut_out: 'cut_out', repaired: 'fill',
    cooked: 'oven', final_quote_sent: 'ready', dispatched: 'ready',
  };
  return map[job.stage] ?? null;
}

interface Flight { x: number; y: number; dx: number; dy: number; rot: number }

export function BranchConsole() {
  const { branch, setBranch, role } = useAppState();
  const jobs = useBranchJobs(branch);
  const intake = useIntakeState();
  const branchRow = BRANCHES.find((b) => b.code === branch)!;

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState<EmailPreview | null>(null);
  const { toast, show, dismiss } = useToast();
  const [flight, setFlight] = useState<Flight | null>(null);
  const lastMove = useRef<{ jobNo: string } | null>(null);
  const reduced = useRef(false);

  const searchRef = useRef<HTMLInputElement | null>(null);
  const bayWashRef = useRef<HTMLDivElement | null>(null);

  const tour = useTour([
    { ref: 'hazard', text: 'Anything waiting on a person sits at the top. Nothing moves until someone decides.' },
    { ref: 'board', text: 'Below that is your shed from above — the route a tyre actually takes through the bays.' },
    { ref: 'bay_inspect', text: 'Each bay shows what is physically in it right now, not a list of statuses.' },
    { ref: 'oven', text: 'The oven counts real cook time. Two tyres curing, with what is left on each.' },
    { ref: 'dials', text: 'Rims, ordered by hours toward their next crack test. Overdue arcs stand out.' },
  ]);

  useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchRef.current) { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === 'Escape') { setEmail(null); tour.end(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onBranch = (code: string) => {
    setBranch(code as typeof branch);
    setQuery('');
    tour.end();
    setLoading(true);
    setTimeout(() => setLoading(false), 700);
  };

  const headerMiddle = (
    <>
      <span style={{ background: 'rgba(234,243,248,.12)', borderRadius: 999, padding: '5px 13px', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}>Workshop floor</span>
      <select
        value={branch}
        onChange={(e) => onBranch(e.target.value)}
        aria-label="Branch"
        style={{ border: '1px solid rgba(234,243,248,.28)', borderRadius: 'var(--td-r-sm)', background: 'rgba(234,243,248,.1)', color: 'var(--td-steel-ink)', fontSize: 15, padding: '8px 11px', width: 216 }}
      >
        {BRANCHES.map((b) => <option key={b.code} value={b.code}>{b.name} — {b.code}</option>)}
      </select>
      <input
        ref={searchRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Find a quote or serial"
        aria-label="Find a job by quote number or serial"
        style={{ border: '1px solid rgba(234,243,248,.28)', borderRadius: 'var(--td-r-sm)', background: 'rgba(234,243,248,.1)', color: 'var(--td-steel-ink)', fontFamily: 'var(--td-mono)', fontSize: 14, padding: '9px 13px', width: 242 }}
      />
    </>
  );
  const headerRight = (
    <>
      <Link to="/performance" style={{ color: 'var(--td-steel-ink)', fontSize: 15, fontWeight: 600, textDecoration: 'none', borderBottom: '2px solid rgba(143,192,232,.5)', paddingBottom: 1, whiteSpace: 'nowrap' }}>
        Branch performance
      </Link>
      <Button variant="steel-ghost" disabled={jobs.length === 0} onClick={tour.start}>
        {jobs.length === 0 ? 'Nothing to show yet' : 'Show me around'}
      </Button>
    </>
  );

  const tyreJobs = jobs.filter((j) => j.rail === 'tyre' && j.stage !== 'not_repairable');
  const rimJobs = jobs.filter((j) => j.rail === 'rim');
  const pausedJobs = tyreJobs.filter((j) => j.paused);
  const rejectedJob = jobs.find((j) => j.stage === 'not_repairable');

  const inBay = (id: string, rail: 'tyre' | 'rim') => (rail === 'tyre' ? tyreJobs : rimJobs).filter((j) => bayOf(j) === id);
  const ovenJobs = tyreJobs.filter((j) => j.stage === 'cooked' && (j.cookRemaining ?? 0) > 0);
  const readyJobs = jobs.filter((j) => bayOf(j) === 'ready');

  const q = query.trim().toUpperCase();
  const matches = q ? jobs.filter((j) => j.jobNo.toUpperCase().includes(q)
    || (j.asset.serial || '').toUpperCase().includes(q)
    || (j.asset.customerAssetNo || '').toUpperCase().includes(q)
    || (j.quote ? j.quote.number.toUpperCase().includes(q) : false)) : [];

  const isEmpty = !loading && jobs.length === 0;
  const showBoard = !loading && jobs.length > 0;

  const receive = (jobNo: string) => (ev: React.MouseEvent<HTMLButtonElement>) => {
    const src = ev.currentTarget.getBoundingClientRect();
    lastMove.current = { jobNo };
    store.advance(jobNo, { by: role.label });
    const dest = bayWashRef.current?.getBoundingClientRect();
    if (dest && !reduced.current) {
      const x = src.left + src.width / 2 - 23;
      const y = src.top + src.height / 2 - 23;
      setFlight({ x, y, dx: 0, dy: 0, rot: 0 });
      requestAnimationFrame(() => requestAnimationFrame(() => {
        setFlight((f) => (f ? { ...f, dx: dest.left + 260 - x, dy: dest.top + dest.height / 2 - y, rot: 540 } : null));
      }));
      setTimeout(() => setFlight(null), 720);
    }
    show('Received, and moved to the wash bay. Sales notified.', true);
  };

  const undo = () => {
    dismiss();
    if (lastMove.current) store.undoLast(lastMove.current.jobNo);
  };

  return (
    <div>
      <HeaderSlot middle={headerMiddle} right={headerRight} />
      <main style={{ maxWidth: 1560, margin: '0 auto', padding: '24px 24px 90px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 28, flexWrap: 'wrap', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--td-ink-3)', marginBottom: 5 }}>{branchRow.region}</div>
            <h1 style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 44, lineHeight: 1, margin: 0 }}>{branchRow.name} — the floor, right now</h1>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
            <StatChip value={tyreJobs.length} label="tyres in" />
            <StatChip value={rimJobs.length} label="rims in" />
            <StatChip value={ovenJobs.length} label="in the oven" heat />
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
            <Link to="/rim/intake" style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--td-paper)', border: '1px solid var(--td-line-strong)', color: 'var(--td-ink)', fontSize: 16, fontWeight: 600, padding: '13px 20px', borderRadius: 'var(--td-r-md)', textDecoration: 'none' }}>
              Take in a rim list
            </Link>
            <Link to="/field" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'var(--td-blue)', color: '#fff', fontSize: 17, fontWeight: 600, padding: '14px 24px', borderRadius: 'var(--td-r-md)', textDecoration: 'none', boxShadow: '0 8px 20px rgba(13,100,173,.28)' }}>
              New site visit <span style={{ fontSize: 19, lineHeight: 1 }}>→</span>
            </Link>
          </div>
        </div>

        {q.length > 0 && !loading && (
          <Card style={{ padding: '20px 22px', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 12, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--td-display)', fontWeight: 600, fontSize: 24 }}>
                {matches.length === 0 ? 'Nothing found' : `${matches.length} ${matches.length === 1 ? 'match' : 'matches'} at ${branchRow.name}`}
              </span>
              <button type="button" onClick={() => setQuery('')} style={{ marginLeft: 'auto', border: 'none', background: 'transparent', color: 'var(--td-blue)', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>Clear search</button>
            </div>
            {matches.map((r) => (
              <Link
                key={r.jobNo}
                to={r.rail === 'rim' ? `/rim/${r.jobNo}/ndt` : `/jobs/${r.jobNo}`}
                style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '13px 14px', border: '1px solid var(--td-line)', borderRadius: 'var(--td-r-md)', textDecoration: 'none', color: 'inherit', marginBottom: 9, background: 'var(--td-ground-soft)' }}
              >
                <span style={{ fontFamily: 'var(--td-mono)', fontSize: 15, fontWeight: 600, width: 158 }}>{r.jobNo}</span>
                <span style={{ fontFamily: 'var(--td-mono)', fontSize: 15, width: 124, color: 'var(--td-blue-deep)' }}>{r.asset.serial || r.asset.customerAssetNo}</span>
                <span style={{ fontFamily: 'var(--td-mono)', fontSize: 15, width: 112 }}>{r.quote ? r.quote.number : 'no quote yet'}</span>
                <span style={{ fontSize: 16, flex: 1 }}>{r.customer}</span>
                <span style={{ background: 'var(--td-blue-tint)', color: 'var(--td-blue-deep)', borderRadius: 999, padding: '5px 13px', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}>{stageById(r.stage)?.label ?? r.stage}</span>
                <span style={{ fontSize: 19, color: 'var(--td-blue)' }}>→</span>
              </Link>
            ))}
            {matches.length === 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', paddingTop: 6 }}>
                <span style={{ fontSize: 17 }}>No job with that quote or serial at {branchRow.name}.</span>
                <button
                  type="button"
                  onClick={() => show(`Searching all eight branches for "${query}"`, false)}
                  style={{ border: '1px solid var(--td-blue)', background: 'var(--td-blue-tint)', color: 'var(--td-blue-deep)', borderRadius: 'var(--td-r-md)', fontSize: 16, fontWeight: 600, padding: '11px 18px', cursor: 'pointer' }}
                >
                  Search all branches?
                </button>
              </div>
            )}
          </Card>
        )}

        {isEmpty && (
          <Card variant="hero" style={{ padding: '52px 40px', textAlign: 'center', animation: 'tdRise 400ms ease-out both' }}>
            <h2 style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 38, margin: '0 0 10px' }}>The floor is clear at {branchRow.name}.</h2>
            <p style={{ fontSize: 18, color: 'var(--td-ink-2)', margin: '0 auto 34px', maxWidth: '42em' }}>
              Nothing is in a bay here. A job starts one of two ways — a repair manager triages tyres at a mine, or a mine sends its rim list in for testing.
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/field" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'var(--td-blue)', color: '#fff', fontSize: 18, fontWeight: 600, padding: '16px 26px', borderRadius: 'var(--td-r-md)', textDecoration: 'none', boxShadow: '0 8px 20px rgba(13,100,173,.28)' }}>
                Start a site visit <span style={{ fontSize: 20, lineHeight: 1 }}>→</span>
              </Link>
              <Link to="/rim/intake" style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--td-paper)', border: '1px solid var(--td-line-strong)', color: 'var(--td-ink)', fontSize: 17, fontWeight: 600, padding: '15px 22px', borderRadius: 'var(--td-r-md)', textDecoration: 'none' }}>
                Take in a rim list
              </Link>
            </div>
          </Card>
        )}

        {loading && <LoadingIndicator title={`Reading the floor at ${branchRow.name}`} sub="Checking what is in each bay." />}

        {showBoard && (
          <div ref={tour.setRef('board')}>
            {(pausedJobs.length > 0 || intake.heldCount > 0) && (
              <div ref={tour.setRef('hazard')} style={{ borderRadius: 'var(--td-r-lg)', overflow: 'hidden', border: '2px solid var(--td-hazard)', boxShadow: 'var(--td-card)', marginBottom: 22, background: 'var(--td-paper)' }}>
                <HazardHeader label={`${pausedJobs.length + (intake.heldCount > 0 ? 1 : 0)} waiting — nothing moves until someone decides`} />
                <div style={{ display: 'grid', gridTemplateColumns: pausedJobs.length && intake.heldCount ? '1fr 1fr' : '1fr', gap: 18, padding: 20 }}>
                  {pausedJobs.map((j) => (
                    <div key={j.jobNo} style={{ border: '1px solid var(--td-line)', borderRadius: 'var(--td-r-md)', background: 'var(--td-ground-soft)', padding: 18, display: 'flex', flexDirection: 'column', gap: 13 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ background: 'var(--td-hazard-tint)', color: 'var(--td-hazard-deep)', border: '1px solid rgba(245,163,0,.5)', borderRadius: 999, padding: '4px 12px', fontSize: 14, fontWeight: 700 }}>Worse than quoted</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <TyreGlyph size={52} />
                        <div>
                          <div style={{ fontFamily: 'var(--td-mono)', fontSize: 17, fontWeight: 600 }}>{j.asset.serial}</div>
                          <div style={{ fontSize: 15, color: 'var(--td-ink-2)' }}>{j.jobNo} · {j.customer}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 16, lineHeight: 1.5 }}>{j.pauseReason}</div>
                      <div style={{ display: 'flex', gap: 11, marginTop: 'auto', flexWrap: 'wrap' }}>
                        <Link to={`/jobs/${j.jobNo}/escalation`} style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: 'var(--td-hazard)', color: 'var(--td-hazard-ink)', fontSize: 17, fontWeight: 700, padding: '13px 21px', borderRadius: 'var(--td-r-md)', textDecoration: 'none', boxShadow: '0 7px 16px rgba(245,163,0,.36)' }}>
                          Open the decision <span style={{ fontSize: 18, lineHeight: 1 }}>→</span>
                        </Link>
                        <Button variant="secondary" onClick={() => setEmail(EMAILS.escalation)}>See what sales gets told</Button>
                      </div>
                    </div>
                  ))}
                  {intake.heldCount > 0 && (
                    <div style={{ border: '1px solid var(--td-line)', borderRadius: 'var(--td-r-md)', background: 'var(--td-ground-soft)', padding: 18, display: 'flex', flexDirection: 'column', gap: 13 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ background: 'var(--td-hazard-tint)', color: 'var(--td-hazard-deep)', border: '1px solid rgba(245,163,0,.5)', borderRadius: 999, padding: '4px 12px', fontSize: 14, fontWeight: 700 }}>Held from a rim list</span>
                        <span style={{ marginLeft: 'auto', fontSize: 15, color: 'var(--td-ink-3)' }}>{intake.customer}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 11 }}>
                        <span style={{ fontFamily: 'var(--td-mono)', fontSize: 38, fontWeight: 600, lineHeight: 1 }}>{intake.heldCount}</span>
                        <span style={{ fontSize: 16, color: 'var(--td-ink-2)' }}>of {intake.rows.length} rows need confirming before a job is created</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 15, color: 'var(--td-ink-2)' }}>
                        {intake.rows.filter((r) => r.state === 'held').slice(0, 4).map((r) => (
                          <span key={r.row}><span style={{ fontFamily: 'var(--td-mono)' }}>{r.customerAssetNo}</span> — {r.problems[0]?.message ?? 'needs confirming'}</span>
                        ))}
                      </div>
                      <div style={{ marginTop: 'auto' }}>
                        <Link to="/rim/intake" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: 'var(--td-hazard)', color: 'var(--td-hazard-ink)', fontSize: 17, fontWeight: 700, padding: '13px 21px', borderRadius: 'var(--td-r-md)', textDecoration: 'none', boxShadow: '0 7px 16px rgba(245,163,0,.36)' }}>
                          Work through the {intake.heldCount} <span style={{ fontSize: 18, lineHeight: 1 }}>→</span>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <SectionHeading title="Tyre line" sub="on the way → wash → inspect → cut out → fill → the oven" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 22 }}>
              {TYRE_BAYS.map((bay) => {
                const list = inBay(bay.id, 'tyre');
                return (
                  <div
                    key={bay.id}
                    ref={(el) => {
                      if (bay.id === 'inspect') tour.setRef('bay_inspect')(el);
                      bayWashRef.current = bay.id === 'wash' ? el : bayWashRef.current;
                    }}
                  >
                    <BayRow label={bay.label} kicker={bay.kicker} count={list.length} word="tyre">
                      {list.map((j) => (
                        <div key={j.jobNo} style={{ width: 302, border: '1px solid var(--td-line)', borderRadius: 'var(--td-r-md)', background: 'var(--td-ground-soft)', padding: '13px 14px', display: 'flex', flexDirection: 'column', gap: 10, animation: 'tdArrive 380ms ease-out both' }}>
                          <Link to={`/jobs/${j.jobNo}`} style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: 'inherit' }}>
                            <TyreGlyph size={42} />
                            <span style={{ minWidth: 0, flex: 1 }}>
                              <span style={{ display: 'block', fontFamily: 'var(--td-mono)', fontSize: 16, fontWeight: 600 }}>{j.asset.serial}</span>
                              <span style={{ display: 'block', fontSize: 15, color: 'var(--td-ink-2)' }}>{j.asset.size} · {j.category}</span>
                            </span>
                            <span style={{ fontSize: 19, color: 'var(--td-blue)' }}>→</span>
                          </Link>
                          <span style={{ fontSize: 14, color: 'var(--td-ink-3)', lineHeight: 1.35 }}>
                            {j.etaLabel || `${j.customer} · ${j.quote ? j.quote.number : 'no quote yet'}`}
                          </span>
                          {j.stage === 'collected' && (
                            <Button variant="primary" style={{ width: '100%', justifyContent: 'center' }} onClick={receive(j.jobNo)}>Mark received</Button>
                          )}
                        </div>
                      ))}
                    </BayRow>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 18, marginBottom: 26 }}>
              <div
                ref={tour.setRef('oven')}
                style={{
                  position: 'relative', overflow: 'hidden', borderRadius: 'var(--td-r-lg)',
                  background: 'radial-gradient(120% 90% at 50% 118%, rgba(210,84,44,.72), transparent 62%), var(--td-steel)',
                  color: '#fff', boxShadow: 'var(--td-card)', padding: '22px 24px',
                }}
              >
                <div aria-hidden style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 96, background: 'linear-gradient(0deg,rgba(210,84,44,.62),transparent)', animation: 'tdHeat 3.4s ease-in-out infinite', pointerEvents: 'none' }} />
                <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 18 }}>
                  <div>
                    <div style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 32, lineHeight: 1 }}>The cook oven</div>
                    <div style={{ fontSize: 16, color: 'var(--td-heat-wash)', marginTop: 5 }}>Hot vulcanising — live cook time</div>
                  </div>
                  <span title="Cook duration is recorded, and only compared with the average of the same category in the data on this screen. Source: the client records cook duration, plus our judgement — no industry cure-time constant is claimed." style={{ border: '1px solid rgba(246,193,166,.5)', color: 'var(--td-heat-wash)', borderRadius: 999, padding: '5px 13px', fontSize: 14, fontWeight: 600, cursor: 'help', whiteSpace: 'nowrap' }}>
                    Where the average comes from
                  </span>
                </div>
                <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: ovenJobs.length > 1 ? 'repeat(auto-fit, minmax(220px, 1fr))' : '1fr', gap: 16 }}>
                  {ovenJobs.length === 0 && <div style={{ fontSize: 16, color: 'var(--td-heat-wash)' }}>No tyres curing right now.</div>}
                  {ovenJobs.map((j) => {
                    const remaining = j.cookRemaining ?? 0;
                    const target = j.cookSeconds ?? 1;
                    const pct = Math.round(((target - remaining) / target) * 100);
                    return (
                      <Link key={j.jobNo} to={`/jobs/${j.jobNo}`} style={{ textDecoration: 'none', color: 'inherit', border: '1px solid rgba(246,193,166,.42)', borderRadius: 'var(--td-r-md)', background: 'rgba(9,14,18,.42)', padding: 16, display: 'flex', flexDirection: 'column', gap: 11, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <TyreGlyph size={44} hot />
                          <span>
                            <span style={{ display: 'block', fontFamily: 'var(--td-mono)', fontSize: 16, fontWeight: 600 }}>{j.asset.serial}</span>
                            <span style={{ display: 'block', fontSize: 15, color: 'var(--td-heat-wash)' }}>{j.asset.size} · {j.category}</span>
                          </span>
                        </div>
                        <div style={{ fontFamily: 'var(--td-mono)', fontSize: 34, fontWeight: 600, lineHeight: 1, letterSpacing: '-.02em', fontVariantNumeric: 'tabular-nums' }}>{fmtHms(remaining)}</div>
                        <div style={{ height: 6, borderRadius: 3, background: 'rgba(246,193,166,.28)', overflow: 'hidden' }}>
                          <div style={{ height: 6, borderRadius: 3, background: 'var(--td-heat-wash)', width: `${pct}%` }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 14, color: 'var(--td-heat-wash)' }}>
                          <span>{fmtHms(target - remaining)} elapsed</span><span>target {fmtHms(target)}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <Card variant="reduced" style={{ padding: '28px 20px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                  <div>
                    <div style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 27, lineHeight: 1 }}>Ready to go out</div>
                    <div style={{ fontSize: 15, color: 'var(--td-ink-3)', marginTop: 4 }}>Quoted final or certified, waiting on the truck</div>
                  </div>
                  <span style={{ background: 'var(--td-pass-tint)', color: 'var(--td-pass-deep)', borderRadius: 999, padding: '5px 13px', fontFamily: 'var(--td-mono)', fontSize: 15, fontWeight: 600 }}>{readyJobs.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {readyJobs.map((j) => (
                    <Link key={j.jobNo} to={j.rail === 'rim' ? `/rim/${j.jobNo}/certs` : `/jobs/${j.jobNo}`} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '12px 14px', border: '1px solid rgba(31,138,77,.4)', borderRadius: 'var(--td-r-md)', background: 'var(--td-pass-tint)', textDecoration: 'none', color: 'inherit' }}>
                      <span style={{ width: 9, height: 34, borderRadius: 5, background: 'var(--td-pass)', flex: 'none' }} />
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontFamily: 'var(--td-mono)', fontSize: 16, fontWeight: 600 }}>{j.rail === 'rim' ? j.asset.customerAssetNo : j.asset.serial}</span>
                        <span style={{ display: 'block', fontSize: 15, color: 'var(--td-ink-2)' }}>{j.customer}</span>
                      </span>
                      <span style={{ background: 'var(--td-paper)', color: 'var(--td-pass-deep)', border: '1px solid rgba(31,138,77,.4)', borderRadius: 999, padding: '4px 11px', fontSize: 14, fontWeight: 600 }}>{j.rail === 'rim' ? 'Certified' : 'Quote final'}</span>
                    </Link>
                  ))}
                  {readyJobs.length === 0 && <div style={{ fontSize: 15, color: 'var(--td-ink-3)' }}>Nothing ready yet.</div>}
                </div>
                {rejectedJob && (
                  <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--td-line)', display: 'flex', alignItems: 'center', gap: 11, flexWrap: 'wrap' }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--td-fail)', flex: 'none' }} />
                    <span style={{ fontSize: 15, color: 'var(--td-ink-2)' }}>1 tyre not repairable this week —</span>
                    <Link to={`/jobs/${rejectedJob.jobNo}`} style={{ fontFamily: 'var(--td-mono)', fontSize: 15, fontWeight: 600 }}>{rejectedJob.jobNo}</Link>
                  </div>
                )}
              </Card>
            </div>

            <SectionHeading title="Rim side" sub="blast → crack testing → paint, or repair and re-test → certify" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
              {RIM_BAYS.map((bay) => {
                const list = inBay(bay.id, 'rim');
                return (
                  <BayRow key={bay.id} label={bay.label} kicker={bay.kicker} count={list.length} word="rim">
                    {list.map((j) => (
                      <Link key={j.jobNo} to={`/rim/${j.jobNo}/ndt`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: '1px solid var(--td-line)', borderRadius: 'var(--td-r-md)', background: 'var(--td-ground-soft)', textDecoration: 'none', color: 'inherit', minWidth: 238 }}>
                        <RimGlyph size={40} />
                        <span style={{ flex: 1 }}>
                          <span style={{ display: 'block', fontFamily: 'var(--td-mono)', fontSize: 16, fontWeight: 600 }}>{j.asset.customerAssetNo}</span>
                          <span style={{ display: 'block', fontSize: 15, color: 'var(--td-ink-2)' }}>{(j.asset.hoursAtRemoval ?? 0).toLocaleString()} h at removal</span>
                        </span>
                        {!!j.findings?.length && (
                          <span style={{ background: 'var(--td-fail-tint)', color: 'var(--td-fail-deep)', border: '1px solid rgba(192,42,34,.4)', borderRadius: 999, padding: '4px 11px', fontSize: 14, fontWeight: 600 }}>
                            {j.findings.length} crack{j.findings.length > 1 ? 's' : ''}
                          </span>
                        )}
                        <span style={{ fontSize: 19, color: 'var(--td-blue)' }}>→</span>
                      </Link>
                    ))}
                  </BayRow>
                );
              })}
            </div>

            <Card variant="reduced" style={{ padding: '28px 22px 22px' }} className="no-print">
              <div ref={tour.setRef('dials')} style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
                <h2 style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 27, margin: 0 }}>Rim hours</h2>
                <span style={{ fontSize: 16, color: 'var(--td-ink-2)' }}>machine hours toward the next crack test</span>
                <span title="10,000 h is this customer's NDT interval. Source: the client, on the discovery call. Rim inspection frequency is risk-based per mine under Queensland Recognised Standard 13, so the interval is held per customer and is adjustable." style={{ marginLeft: 'auto', background: 'var(--td-blue-tint)', color: 'var(--td-blue-deep)', borderRadius: 999, padding: '5px 13px', fontSize: 14, fontWeight: 600, cursor: 'help', whiteSpace: 'nowrap' }}>
                  10,000 h — this customer&rsquo;s interval
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 16 }}>
                {rimJobs.map((j) => (
                  <RimHourDial key={j.jobNo} hours={j.asset.hoursAtRemoval ?? 0} assetNo={j.asset.customerAssetNo ?? j.asset.serial} />
                ))}
              </div>
            </Card>
          </div>
        )}
      </main>

      {flight && (
        <div
          aria-hidden
          style={{
            position: 'fixed', zIndex: 70, pointerEvents: 'none', left: flight.x, top: flight.y,
            transform: `translate(${flight.dx}px,${flight.dy}px) rotate(${flight.rot}deg)`, transition: 'transform 660ms cubic-bezier(.3,.9,.2,1)',
          }}
        >
          <TyreGlyph size={46} style={{ filter: 'drop-shadow(0 8px 16px rgba(17,28,36,.4))' }} />
        </div>
      )}

      <Toast toast={toast} onUndo={undo} onDismiss={dismiss} />
      {email && <EmailModal email={email} onClose={() => setEmail(null)} />}
      {tour.active && <TourOverlay step={tour.step} rect={tour.rect} total={tour.total} text={tour.text} onNext={tour.next} onEnd={tour.end} />}
    </div>
  );
}

function StatChip({ value, label, heat }: { value: number; label: string; heat?: boolean }) {
  return (
    <div style={{
      background: heat ? 'var(--td-heat-deep)' : 'var(--td-paper)', border: `1px solid ${heat ? 'var(--td-heat-deep)' : 'var(--td-line)'}`,
      borderRadius: 'var(--td-r-md)', padding: '10px 16px', boxShadow: 'var(--td-card)', color: heat ? '#fff' : undefined,
    }}
    >
      <div style={{ fontFamily: 'var(--td-mono)', fontSize: 26, fontWeight: 600, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 14, color: heat ? undefined : 'var(--td-ink-3)' }}>{label}</div>
    </div>
  );
}

function SectionHeading({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 12, flexWrap: 'wrap' }}>
      <h2 style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 30, margin: 0 }}>{title}</h2>
      <span style={{ fontSize: 16, color: 'var(--td-ink-2)' }}>{sub}</span>
    </div>
  );
}

function BayRow({
  label, kicker, count, word, children,
}: { label: string; kicker: string; count: number; word: string; children: React.ReactNode }) {
  return (
    <Card variant="row" style={{ display: 'grid', gridTemplateColumns: '214px 1fr', gap: 20, alignItems: 'stretch', padding: '16px 20px 16px 22px' }}>
      <div>
        <div style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 25, lineHeight: 1.05 }}>{label}</div>
        <div style={{ fontSize: 15, color: 'var(--td-ink-3)', marginTop: 2 }}>{kicker}</div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 9, background: 'var(--td-blue-tint)', color: 'var(--td-blue-deep)', borderRadius: 999, padding: '4px 12px', fontSize: 14, fontWeight: 700 }}>
          {count} {word}{count === 1 ? '' : 's'} here
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start', width: '100%' }}>
        {count === 0 ? <div style={{ alignSelf: 'center', fontSize: 16, color: 'var(--td-ink-3)' }}>Bay clear</div> : children}
      </div>
    </Card>
  );
}
