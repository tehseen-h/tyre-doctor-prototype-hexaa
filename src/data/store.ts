// The in-memory data layer. Reads like an API — subscribe/getters/actions —
// so a real backend could replace it later without touching a screen.
//
// M1 contract: a job's `stage` is NEVER written directly. It is always
// `events[events.length - 1].to`. Advancing, overriding and undoing all work
// by appending a new StageEvent; nothing is ever mutated or deleted from the
// log, which is what the certificates and job report depend on.
import type {
  Job, StageEvent, Photo, IntakeRow, SiteVisitTyre, BranchReport, RimFinding, Certificate,
} from '../types/domain';
import { railStages, stageIndex, nextStageId, stageById } from '../config/stages';
import { categoryFor } from '../config/rules';
import {
  ALL_JOBS, BRANCH_REPORTS, TYRE_JOBS,
} from './fixtures';
import { atLabel } from './format';

// ── staff used consistently across synthesized history ──────────────────────
const STAFF = {
  repairer: ['T. Barlow (repairer)', 'L. Ferraro (repairer)'],
  supervisor: 'M. Oduya (supervisor)',
  sales: 'D. Rennick (sales)',
  logistics: 'R. Kaur (logistics)',
  ndt: ['A. Petrov', 'S. Ngata'],
  repairManager: 'J. Whelan (repair mgr)',
};

const TYRE_STAGE_HOURS: Record<string, number> = { triaged: 8, initial_quote_sent: 20, collected: 16, received: 6, washed: 9, inspected: 14, cut_out: 11, repaired: 19, cooked: 2, final_quote_sent: 10, dispatched: 24 };
const RIM_STAGE_HOURS: Record<string, number> = { notified: 4, rim_received: 6, blasted: 5, ndt_tested: 6, btp: 4, rim_repaired: 12, retested: 4, certified: 3, rim_dispatched: 20 };

function actorFor(stageId: string, i: number): string {
  const def = stageById(stageId);
  if (!def) return STAFF.supervisor;
  if (def.actor.includes('Sales')) return STAFF.sales;
  if (def.actor.includes('Logistics')) return STAFF.logistics;
  if (def.actor.includes('Supervisor') && !def.actor.includes('repairer')) return STAFF.supervisor;
  if (def.actor.includes('NDT')) return STAFF.ndt[i % 2];
  if (def.actor.includes('Repair manager')) return STAFF.repairManager;
  if (def.actor.includes('Repairer') || def.actor.includes('repairer')) return STAFF.repairer[i % 2];
  return STAFF.supervisor;
}

/** Builds a plausible, honest history for jobs the fixture only gave a `stage` for. */
function synthesizeEvents(job: Job, seedIndex: number): StageEvent[] {
  const stages = railStages(job.rail);
  const idx = stageIndex(job.rail, job.stage);
  if (idx <= 0) {
    return [{ from: '—', to: stages[0]?.id ?? job.stage, by: actorFor(stages[0]?.id ?? job.stage, seedIndex), at: atLabel(anchor(seedIndex, 0)) }];
  }
  const hoursTable = job.rail === 'rim' ? RIM_STAGE_HOURS : TYRE_STAGE_HOURS;
  const events: StageEvent[] = [];
  let clock = 0;
  for (let i = 0; i <= idx; i += 1) {
    const from = i === 0 ? '—' : stages[i - 1].id;
    const to = stages[i].id;
    events.push({ from, to, by: actorFor(to, seedIndex + i), at: atLabel(anchor(seedIndex, clock)) });
    clock += hoursTable[to] ?? 8;
  }
  return events;
}

/** Deterministic-enough anchor date so re-running the app looks the same within a session. */
function anchor(seedIndex: number, hoursFromStart: number): Date {
  const base = new Date(2026, 7, 1, 7, 0, 0); // 01 Aug 2026, 07:00 — matches the fixture era
  const dayOffset = seedIndex % 9;
  const d = new Date(base.getTime());
  d.setDate(d.getDate() + dayOffset);
  d.setTime(d.getTime() + hoursFromStart * 3600 * 1000);
  return d;
}

type Listener = () => void;

class Store {
  private jobs = new Map<string, Job>();

  private listeners = new Set<Listener>();

  /** Bumped on every emit; useStore.ts hooks memoize derived arrays against this instead of recomputing (and returning a new reference) on every render. */
  version = 0;

  private tyreSeq = 423;

  private rimSeq = 137;

  private visitSeq = 92;

  private certSeq = 311;

  constructor() {
    this.seed();
  }

  private seed() {
    this.jobs.clear();
    ALL_JOBS.forEach((raw, i) => {
      const job: Job = structuredClone(raw);
      if (!job.events || job.events.length === 0) {
        job.events = synthesizeEvents(job, i);
      }
      if (job.quotedCategory === undefined) job.quotedCategory = job.category;
      this.jobs.set(job.jobNo, job);
    });
  }

  reset() {
    this.tyreSeq = 423;
    this.rimSeq = 137;
    this.visitSeq = 92;
    this.certSeq = 311;
    this.seed();
    this.emit();
  }

  subscribe = (fn: Listener) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  private emit() {
    this.version += 1;
    this.listeners.forEach((fn) => fn());
  }

  getAll(): Job[] {
    return Array.from(this.jobs.values());
  }

  getByBranch(branch: string): Job[] {
    return this.getAll().filter((j) => j.branch === branch);
  }

  get(jobNo: string): Job | undefined {
    return this.jobs.get(jobNo);
  }

  /** Derived, never stored: the current stage is always the last event's `to`. */
  static stageOf(job: Job): string {
    return job.events.length ? job.events[job.events.length - 1].to : job.stage;
  }

  private touch(job: Job) {
    job.stage = Store.stageOf(job);
    this.jobs.set(job.jobNo, job);
    this.emit();
  }

  /** What is still missing before `job` can advance out of its current stage. */
  requiredCaptureGaps(job: Job, draft: { photo?: boolean; cookValid?: boolean }): string[] {
    const stage = Store.stageOf(job);
    const gaps: string[] = [];
    if (stage === 'cooked') {
      if (draft.photo === false) gaps.push('there is no photo of the finished repair');
      if (draft.cookValid === false) gaps.push('the typed duration is not hh:mm:ss');
    }
    return gaps;
  }

  /** Append-only advance. Throws if a required capture is missing and no overrideReason given. */
  advance(jobNo: string, opts: {
    by: string;
    payload?: Record<string, string | number | boolean>;
    photos?: Photo[];
    overrideReason?: string;
    gaps?: string[];
    /** Fields the capture recorded that the job record itself should reflect (category, damageSizeMm...) — not just the event log. */
    patch?: Partial<Job>;
  }): StageEvent {
    const job = this.mustGet(jobNo);
    const from = Store.stageOf(job);
    const to = nextStageId(job.rail, from);
    if (!to) throw new Error(`${jobNo} has no next stage from ${from}`);
    if (opts.gaps && opts.gaps.length && !opts.overrideReason) {
      throw new Error(`Blocked: ${opts.gaps.join(', ')}`);
    }
    const event: StageEvent = {
      from, to, by: opts.by, at: atLabel(), payload: opts.payload, photos: opts.photos, overrideReason: opts.overrideReason,
    };
    job.events.push(event);
    if (opts.photos?.length) job.photos.push(...opts.photos);
    if (opts.patch) Object.assign(job, opts.patch);
    if (to === 'cooked' && job.cookSeconds) job.cookRemaining = job.cookSeconds;
    this.touch(job);
    return event;
  }

  /**
   * Explicit-target advance, for the rim rail's branch point at `ndt_tested`
   * (pass → btp, fail → rim_repaired) where the next stage isn't simply "the
   * next array entry" — nextStageId() is sequential and can't express a fork.
   */
  advanceTo(jobNo: string, to: string, opts: { by: string; payload?: Record<string, string | number | boolean> }): StageEvent {
    const job = this.mustGet(jobNo);
    const from = Store.stageOf(job);
    const event: StageEvent = {
      from, to, by: opts.by, at: atLabel(), payload: opts.payload,
    };
    job.events.push(event);
    this.touch(job);
    return event;
  }

  /** Compensating event — never deletes history, so an undo still shows in the trail. */
  undoLast(jobNo: string): void {
    const job = this.mustGet(jobNo);
    const last = job.events[job.events.length - 1];
    if (!last) return;
    job.events.push({
      from: last.to, to: last.from === '—' ? last.to : last.from, by: 'System — undo', at: atLabel(),
      payload: { undo_of: last.to },
    });
    this.touch(job);
  }

  setCookRemaining(jobNo: string, seconds: number) {
    const job = this.mustGet(jobNo);
    job.cookRemaining = Math.max(0, seconds);
    this.touch(job);
  }

  tickOvens() {
    let changed = false;
    this.jobs.forEach((job) => {
      if (Store.stageOf(job) === 'cooked' && (job.cookRemaining ?? 0) > 0) {
        job.cookRemaining = (job.cookRemaining ?? 0) - 1;
        changed = true;
      }
    });
    if (changed) this.emit();
  }

  /** The escalation gate: pauses one tyre while the rest of the batch keeps moving. */
  escalate(jobNo: string, opts: { reason: string; by: string; newCategory: Job['category']; photoId?: string }): void {
    const job = this.mustGet(jobNo);
    job.paused = true;
    job.pauseReason = opts.reason;
    job.category = opts.newCategory;
    const stage = Store.stageOf(job);
    job.events.push({
      from: stage, to: stage, by: opts.by, at: atLabel(),
      payload: { action: 'escalated', reason: opts.reason, new_category: opts.newCategory ?? '' },
    });
    if (job.quote) {
      job.quote.history.push({ status: job.quote.status, at: atLabel(), by: opts.by, reason: opts.reason, photoId: opts.photoId });
    }
    this.touch(job);
  }

  /** Sales revises the quote in NetSuite; this un-pauses the tyre. */
  resolveEscalation(jobNo: string, opts: { by: string }): void {
    const job = this.mustGet(jobNo);
    job.paused = false;
    const priorReason = job.pauseReason;
    job.pauseReason = undefined;
    const stage = Store.stageOf(job);
    job.events.push({
      from: stage, to: stage, by: opts.by, at: atLabel(),
      payload: { action: 'revised_quote_sent', was: priorReason ?? '' },
    });
    if (job.quote) {
      job.quote.status = 'Revised';
      job.quote.history.push({ status: 'Revised', at: atLabel(), by: opts.by });
    }
    this.touch(job);
  }

  addFinding(jobNo: string, finding: Omit<RimFinding, 'id'>): RimFinding {
    const job = this.mustGet(jobNo);
    const f: RimFinding = { ...finding, id: `f-${job.jobNo}-${(job.findings?.length ?? 0) + 1}` };
    job.findings = [...(job.findings ?? []), f];
    this.touch(job);
    return f;
  }

  issueCertificates(jobNo: string, opts: { method: string; technician: string; competencyUnit: string; wasRepaired: boolean }): Certificate[] {
    const job = this.mustGet(jobNo);
    this.certSeq += 1;
    const num = String(this.certSeq).padStart(4, '0');
    const nextDue = (job.asset.hoursAtRemoval ?? 0) + 10000;
    job.asset.nextNdtDueHours = nextDue;
    const certs: Certificate[] = [
      { number: `NDT-MKY-26-${num}`, kind: 'ndt', issuedAt: atLabel().split(' · ')[0], technician: opts.technician, competencyUnit: opts.competencyUnit, method: opts.method, nextNdtDueHours: nextDue },
      { number: `RRC-MKY-26-${num}`, kind: 'repair', issuedAt: atLabel().split(' · ')[0], technician: opts.technician, competencyUnit: opts.competencyUnit, method: opts.wasRepaired ? 'Sections cut out / cracks welded / sections replaced' : 'Blast, test, paint', nextNdtDueHours: nextDue },
    ];
    job.certificates = certs;
    this.touch(job);
    return certs;
  }

  // ── job creation (Field capture + Rim intake) ──────────────────────────────

  createTyreJobFromTriage(input: {
    branch: 'MKY'; customer: string; site: string; visitNo: string;
    serial: string; make: string; size: string; fleetNo: string;
    repairable: boolean; position?: SiteVisitTyre['position']; sizeMm?: number; reason?: string;
    capturedBy: string; capturedAt?: string; where: string; photos: Photo[];
  }): Job {
    this.tyreSeq += 1;
    const jobNo = `MKY-TR-26-${String(this.tyreSeq).padStart(4, '0')}`;
    const category = input.repairable && input.sizeMm !== undefined ? categoryFor(input.sizeMm, false, input.position) : undefined;
    const job: Job = {
      jobNo, rail: 'tyre', branch: input.branch, customer: input.customer, site: input.site, visitNo: input.visitNo,
      asset: { id: jobNo, kind: 'tyre', serial: input.serial, make: input.make as Job['asset']['make'], size: input.size, fleetNo: input.fleetNo, history: [] },
      stage: input.repairable ? 'triaged' : 'not_repairable',
      category, quotedCategory: category, damagePosition: input.position, damageSizeMm: input.sizeMm,
      outcome: input.repairable ? undefined : input.reason,
      events: [{
        from: '—', to: input.repairable ? 'triaged' : 'not_repairable', by: input.capturedBy, at: input.capturedAt ?? atLabel(),
        payload: { repairable: input.repairable, position: input.position ?? '' },
        photos: input.photos,
      }],
      photos: input.photos,
    };
    this.jobs.set(jobNo, job);
    this.emit();
    return job;
  }

  createRimJobFromIntake(row: IntakeRow, customer: string, site: string): Job {
    this.rimSeq += 1;
    const jobNo = `MKY-RJ-26-${String(this.rimSeq).padStart(4, '0')}`;
    const hours = Number(row.hours) || 0;
    const job: Job = {
      jobNo, rail: 'rim', branch: 'MKY', customer, site,
      asset: {
        id: jobNo, kind: 'rim', serial: row.rimSerial, customerAssetNo: row.customerAssetNo, size: row.size,
        fleetNo: row.fleetNo, hoursAtRemoval: hours, nextNdtDueHours: hours ? hours + 10000 : null, history: [],
      },
      stage: 'notified',
      events: [{ from: '—', to: 'notified', by: 'Sales — rim intake', at: atLabel(), payload: { hours_at_removal: hours } }],
      photos: [],
    };
    this.jobs.set(jobNo, job);
    this.emit();
    return job;
  }

  nextVisitNo(): string {
    return `SV-26-${String(this.visitSeq + 1).padStart(4, '0')}`;
  }

  commitVisit(): void {
    this.visitSeq += 1;
    this.emit();
  }

  mustGet(jobNo: string): Job {
    const job = this.jobs.get(jobNo);
    if (!job) throw new Error(`Unknown job ${jobNo}`);
    return job;
  }

  // ── branch performance, computed from the live event log for Mackay ───────

  branchReports(): BranchReport[] {
    const mky = this.computeMackayReport();
    return BRANCH_REPORTS.map((r) => (r.branch === 'MKY' ? mky : r));
  }

  private computeMackayReport(): BranchReport {
    const fallback = BRANCH_REPORTS.find((r) => r.branch === 'MKY')!;
    const jobs = this.getByBranch('MKY').filter((j) => j.rail === 'tyre');
    const minors = jobs.filter((j) => j.category === 'Minor').length;
    const intermediates = jobs.filter((j) => j.category === 'Intermediate').length;
    const majors = jobs.filter((j) => j.category === 'Major').length;
    const jobsClosed = jobs.filter((j) => j.stage === 'closed').length + this.getByBranch('MKY').filter((j) => j.stage === 'rim_closed').length;
    const rejected = jobs.filter((j) => j.stage === 'not_repairable').length;
    const rejectionRate = jobs.length ? rejected / (jobs.length + rejected) : fallback.rejectionRate;

    const durations: Record<string, number[]> = {};
    jobs.forEach((job) => {
      for (let i = 1; i < job.events.length; i += 1) {
        const prev = job.events[i - 1];
        const cur = job.events[i];
        if (!['received', 'washed', 'inspected', 'cut_out', 'repaired', 'cooked'].includes(cur.to)) continue;
        const dt = parseAt(cur.at);
        const pt = parseAt(prev.at);
        if (!dt || !pt) continue;
        const hours = Math.max(0.5, (dt.getTime() - pt.getTime()) / 3_600_000);
        (durations[cur.to] ??= []).push(hours);
      }
    });
    const avgStageHours: Record<string, number> = {};
    Object.keys(fallback.avgStageHours).forEach((k) => {
      const list = durations[k];
      avgStageHours[k] = list && list.length ? Math.round((list.reduce((a, b) => a + b, 0) / list.length) * 10) / 10 : fallback.avgStageHours[k];
    });

    return {
      branch: 'MKY',
      minors: minors || fallback.minors,
      intermediates: intermediates || fallback.intermediates,
      majors: majors || fallback.majors,
      jobsClosed: jobsClosed || fallback.jobsClosed,
      manHours: fallback.manHours, // labour is not captured digitally anywhere — typed in on Branch Performance
      repairHours: Math.round(Object.values(avgStageHours).reduce((a, b) => a + b, 0) * (jobs.length || fallback.jobsClosed) / 6),
      rejectionRate,
      avgStageHours,
    };
  }
}

function parseAt(s: string): Date | null {
  const m = /(\d{2}) (\w{3}) (\d{2}) · (\d{2}):(\d{2})/.exec(s);
  if (!m) return null;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const mi = months.indexOf(m[2]);
  if (mi === -1) return null;
  return new Date(2000 + Number(m[3]), mi, Number(m[1]), Number(m[4]), Number(m[5]));
}

export const store = new Store();
export type { Store };
export const seedTyreJobCount = TYRE_JOBS.length;
