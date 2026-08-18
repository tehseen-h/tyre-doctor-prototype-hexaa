import { useMemo, useState } from 'react';
import type { Job, Photo } from '../../types/domain';
import { stageById, nextStageId } from '../../config/stages';
import { store } from '../../data/store';
import { useAppState } from '../../app/AppState';
import { Button } from '../../components/Button';
import { EvidenceTile } from '../../components/EvidenceTile';
import { STAGE_FIELDS } from './stageForms';
import { atLabel, fmtHms, parseHms } from '../../data/format';

export function StageDrawer({ job, onClose, onConfirmed }: { job: Job; onClose: () => void; onConfirmed: (message: string) => void }) {
  const { role } = useAppState();
  const from = job.stage;
  const to = nextStageId(job.rail, from);
  const fromDef = stageById(from);
  const toDef = to ? stageById(to) : null;
  const fields = STAGE_FIELDS[from] ?? [];
  const isCookStage = from === 'cooked';

  const [values, setValues] = useState<Record<string, string>>({});
  const [photosTaken, setPhotosTaken] = useState<Record<string, boolean>>({});
  const [overrideReason, setOverrideReason] = useState('');
  const [entryMode, setEntryMode] = useState<'timer' | 'typed'>('timer');
  const [typedValue, setTypedValue] = useState(fmtHms(job.cookSeconds ?? 5400));
  const [cookPhoto, setCookPhoto] = useState(false);
  const [confirmed, setConfirmed] = useState<string | null>(null);

  const gaps = useMemo(() => {
    if (isCookStage) {
      const g: string[] = [];
      if (!cookPhoto) g.push('there is no photo of the finished repair');
      if (entryMode === 'typed' && parseHms(typedValue) === null) g.push('the typed duration is not hh:mm:ss');
      return g;
    }
    const g: string[] = [];
    fields.forEach((f) => {
      if (!f.required) return;
      if (f.type === 'photo') { if (!photosTaken[f.key]) g.push(`there is no ${f.label.toLowerCase()}`); return; }
      if (!values[f.key]?.trim()) g.push(`${f.label.toLowerCase()} is missing`);
    });
    return g;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCookStage, cookPhoto, entryMode, typedValue, fields, values, photosTaken]);

  const blocked = gaps.length > 0;

  if (!to || !toDef) {
    return (
      <DrawerShell onClose={onClose} title="Closed" subtitle={job.jobNo}>
        <div style={{ padding: 22, fontSize: 16, color: 'var(--td-ink-2)' }}>This job has reached the end of its rail — there is nothing further to advance.</div>
      </DrawerShell>
    );
  }

  const doAdvance = (withOverride?: string) => {
    const payload: Record<string, string | number | boolean> = {};
    const photos: Photo[] = [];
    const patch: Partial<Job> = {};
    if (isCookStage) {
      const cookSeconds = entryMode === 'typed' ? (parseHms(typedValue) ?? job.cookSeconds ?? 0) : (job.cookSeconds ?? 0) - (job.cookRemaining ?? 0);
      payload['cook duration'] = fmtHms(cookSeconds);
      payload['entry method'] = entryMode === 'timer' ? 'Live timer' : 'Typed entry';
      if (cookPhoto) photos.push(makePhoto(job, 'repair', 'Finished repair'));
    } else {
      fields.forEach((f) => {
        if (f.type === 'photo') { if (photosTaken[f.key]) photos.push(makePhoto(job, f.photoKind ?? 'repair', f.label)); return; }
        if (values[f.key]) payload[f.label.toLowerCase()] = values[f.key];
      });
      // The job's own record must reflect what was measured, not just the event log —
      // otherwise the escalation screen and "what we measured" card show stale fixture values.
      if (from === 'washed') {
        if (values.category) patch.category = values.category as Job['category'];
        if (values.sizeMm) patch.damageSizeMm = Number(values.sizeMm);
        if (values.beltPly) patch.beltPlyDamage = values.beltPly === 'Yes';
      }
      if (from === 'cut_out' && values.repairUnit) patch.repairUnit = values.repairUnit;
    }
    try {
      store.advance(job.jobNo, {
        by: role.label, payload, photos, overrideReason: withOverride, gaps: withOverride ? undefined : gaps, patch,
      });
      const msg = withOverride
        ? 'Advanced by override — the reason is logged against the job.'
        : `${toDef.label} confirmed. ${toDef.notify ? `${toDef.notify.split(' — ')[0]} notified.` : ''}`.trim();
      setConfirmed(msg);
      onConfirmed(msg);
    } catch (e) {
      // Blocked without an override — surfaced via the gaps list already; nothing else to do.
    }
  };

  return (
    <DrawerShell onClose={onClose} title={`${fromDef?.label ?? from} → ${toDef.label}`} subtitle={`${job.jobNo} · ${job.asset.serial || job.asset.customerAssetNo}`}>
      <div style={{ flex: 1, overflow: 'auto', padding: 22 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--td-ink-2)', marginBottom: 12 }}>What this stage needs</div>

        {isCookStage ? (
          <CookFields
            job={job} entryMode={entryMode} setEntryMode={setEntryMode} typedValue={typedValue} setTypedValue={setTypedValue}
            cookPhoto={cookPhoto} setCookPhoto={setCookPhoto}
          />
        ) : (
          <div style={{ border: '1px solid var(--td-line)', borderRadius: 'var(--td-r-md)', background: 'var(--td-ground-soft)', padding: 18, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {fields.length === 0 && <div style={{ fontSize: 16, color: 'var(--td-ink-2)' }}>One tap confirms this stage — nothing else to capture.</div>}
            {fields.map((f) => (
              <div key={f.key}>
                {f.type === 'photo' ? (
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--td-ink-2)', marginBottom: 8 }}>{f.label}</div>
                    {photosTaken[f.key] ? (
                      <EvidenceTile kind={(f.photoKind as Photo['kind']) ?? 'repair'} at={atLabel()} by={role.label} stageLabel={fromDef?.label ?? from} where={job.site} width={140} height={104} />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPhotosTaken((s) => ({ ...s, [f.key]: true }))}
                        style={{
                          width: '100%', minHeight: 90, border: '2px dashed var(--td-line-strong)', borderRadius: 'var(--td-r-md)', background: 'var(--td-paper)',
                          cursor: 'pointer', display: 'grid', placeItems: 'center', fontSize: 16, fontWeight: 600, color: 'var(--td-ink-2)',
                        }}
                      >
                        Tap to take the photo
                      </button>
                    )}
                  </div>
                ) : f.type === 'yesno' ? (
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--td-ink-2)', marginBottom: 8 }}>{f.label}</div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {['Yes', 'No'].map((opt) => (
                        <Button
                          key={opt}
                          variant={values[f.key] === opt ? 'primary' : 'secondary'}
                          onClick={() => setValues((s) => ({ ...s, [f.key]: opt }))}
                        >
                          {opt}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : f.type === 'select' ? (
                  <label style={{ display: 'block' }}>
                    <span style={{ display: 'block', fontSize: 15, fontWeight: 600, color: 'var(--td-ink-2)', marginBottom: 7 }}>{f.label}</span>
                    <select
                      value={values[f.key] ?? ''}
                      onChange={(e) => setValues((s) => ({ ...s, [f.key]: e.target.value }))}
                      style={{ border: '1px solid var(--td-line-strong)', borderRadius: 'var(--td-r-sm)', background: 'var(--td-paper)', color: 'var(--td-ink)', width: '100%', fontSize: 16, padding: 12 }}
                    >
                      <option value="">Choose…</option>
                      {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </label>
                ) : (
                  <label style={{ display: 'block' }}>
                    <span style={{ display: 'block', fontSize: 15, fontWeight: 600, color: 'var(--td-ink-2)', marginBottom: 7 }}>{f.label}</span>
                    <input
                      value={values[f.key] ?? ''}
                      onChange={(e) => setValues((s) => ({ ...s, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      style={{ border: '1px solid var(--td-line-strong)', borderRadius: 'var(--td-r-sm)', background: 'var(--td-paper)', color: 'var(--td-ink)', width: '100%', fontSize: 16, padding: 12 }}
                    />
                  </label>
                )}
              </div>
            ))}
          </div>
        )}

        {blocked && !confirmed && (
          <>
            <div style={{ border: '2px solid var(--td-fail)', borderRadius: 'var(--td-r-md)', background: 'var(--td-fail-tint)', padding: 18, marginBottom: 16 }}>
              <div style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 22, color: 'var(--td-fail-deep)', marginBottom: 8 }}>Can&rsquo;t mark this stage yet</div>
              <div style={{ fontSize: 16, color: 'var(--td-fail-deep)', lineHeight: 1.5 }}>Before this can advance — {gaps.join(', ')}.</div>
            </div>
            <div style={{ border: '1px solid var(--td-line)', borderRadius: 'var(--td-r-md)', background: 'var(--td-ground-soft)', padding: 18, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--td-ink-2)' }}>Supervisor override</span>
                <span
                  title="A stage cannot advance without its required capture. A supervisor override is allowed, but it is logged with a reason. Source: our judgement — workshops need an escape hatch, and the log keeps it honest."
                  style={{ background: 'var(--td-blue-tint)', color: 'var(--td-blue-deep)', borderRadius: 999, padding: '3px 11px', fontSize: 14, fontWeight: 600, cursor: 'help' }}
                >
                  Why this exists
                </span>
              </div>
              <label style={{ display: 'block', marginBottom: 14 }}>
                <span style={{ display: 'block', fontSize: 15, color: 'var(--td-ink-2)', marginBottom: 7 }}>Reason — recorded against the job with your name</span>
                <input
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Camera flat — photo taken on the shop phone"
                  style={{ border: '1px solid var(--td-line-strong)', borderRadius: 'var(--td-r-sm)', background: 'var(--td-paper)', color: 'var(--td-ink)', width: '100%', fontSize: 16, padding: 12 }}
                />
              </label>
              <Button
                variant="secondary"
                disabled={!overrideReason.trim()}
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => doAdvance(overrideReason.trim())}
              >
                Override and advance
              </Button>
            </div>
          </>
        )}

        {confirmed && (
          <div style={{ border: '2px solid var(--td-pass)', borderRadius: 'var(--td-r-md)', background: 'var(--td-pass-tint)', padding: 18, marginBottom: 16, animation: 'tdRise 220ms ease-out both' }}>
            <div style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 23, color: 'var(--td-pass-deep)', marginBottom: 6 }}>Stage confirmed</div>
            <div style={{ fontSize: 16, color: 'var(--td-pass-deep)', lineHeight: 1.5 }}>{confirmed}</div>
          </div>
        )}

        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--td-ink-2)', margin: '22px 0 10px' }}>Who gets told</div>
        <div style={{ fontSize: 16, color: 'var(--td-ink-2)', lineHeight: 1.5 }}>{toDef.notify ?? 'Nobody — this step is not notified.'}</div>
      </div>

      <div style={{ padding: '18px 22px', borderTop: '1px solid var(--td-line)', display: 'flex', gap: 12, background: 'var(--td-ground-soft)' }}>
        <Button variant="primary" size="xl" disabled={blocked || !!confirmed} style={{ flex: 1, justifyContent: 'center' }} onClick={() => doAdvance()}>
          Confirm {toDef.label.toLowerCase()}
        </Button>
        <Button variant="secondary" size="lg" onClick={onClose}>{confirmed ? 'Close' : 'Cancel'}</Button>
      </div>
    </DrawerShell>
  );
}

function makePhoto(job: Job, kind: string, note: string): Photo {
  return {
    id: `ph-${job.jobNo}-${Date.now()}`, kind: kind as Photo['kind'], stage: job.stage, capturedBy: 'you', capturedAt: atLabel(), where: job.site, note,
  };
}

function CookFields({
  job, entryMode, setEntryMode, typedValue, setTypedValue, cookPhoto, setCookPhoto,
}: {
  job: Job; entryMode: 'timer' | 'typed'; setEntryMode: (m: 'timer' | 'typed') => void; typedValue: string; setTypedValue: (v: string) => void;
  cookPhoto: boolean; setCookPhoto: (v: boolean) => void;
}) {
  const remaining = job.cookRemaining ?? 0;
  const target = job.cookSeconds ?? 1;
  const pct = Math.round(((target - remaining) / target) * 100);
  return (
    <>
      <div style={{ border: '1px solid var(--td-line)', borderRadius: 'var(--td-r-md)', background: 'var(--td-ground-soft)', padding: 18, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 22 }}>Cook duration</span>
          <div style={{ display: 'flex', border: '1px solid var(--td-line-strong)', borderRadius: 999, overflow: 'hidden', background: 'var(--td-paper)' }}>
            <button type="button" onClick={() => setEntryMode('timer')} style={{ border: 'none', background: entryMode === 'timer' ? 'var(--td-blue)' : 'transparent', color: entryMode === 'timer' ? '#fff' : 'var(--td-ink)', fontSize: 15, fontWeight: 600, padding: '9px 16px', cursor: 'pointer' }}>Live timer</button>
            <button type="button" onClick={() => setEntryMode('typed')} style={{ border: 'none', background: entryMode === 'typed' ? 'var(--td-blue)' : 'transparent', color: entryMode === 'typed' ? '#fff' : 'var(--td-ink)', fontSize: 15, fontWeight: 600, padding: '9px 16px', cursor: 'pointer' }}>Type it in</button>
          </div>
        </div>
        {entryMode === 'timer' ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
              <span style={{ fontFamily: 'var(--td-mono)', fontSize: 42, fontWeight: 600, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{fmtHms(remaining)}</span>
              <span style={{ fontSize: 16, color: 'var(--td-ink-2)' }}>left of {fmtHms(target)}</span>
            </div>
            <div style={{ height: 7, borderRadius: 4, background: '#e2e8ed', marginTop: 14, overflow: 'hidden' }}>
              <div style={{ height: 7, borderRadius: 4, background: 'var(--td-heat)', width: `${pct}%` }} />
            </div>
            <div style={{ fontSize: 15, color: 'var(--td-ink-2)', marginTop: 12 }}>The timer started when Repaired was confirmed, and keeps counting if the tablet sleeps.</div>
          </div>
        ) : (
          <div>
            <label style={{ display: 'block' }}>
              <span style={{ display: 'block', fontSize: 15, fontWeight: 600, color: 'var(--td-ink-2)', marginBottom: 7 }}>Duration — hh:mm:ss</span>
              <input
                value={typedValue}
                onChange={(e) => setTypedValue(e.target.value)}
                style={{ border: '1px solid var(--td-line-strong)', borderRadius: 'var(--td-r-sm)', background: 'var(--td-paper)', color: 'var(--td-ink)', width: 212, fontFamily: 'var(--td-mono)', fontSize: 26, padding: 13 }}
              />
            </label>
            <div style={{ fontSize: 15, color: 'var(--td-ink-2)', marginTop: 12 }}>Use this when the cook was run on the press timer and written on the sheet.</div>
          </div>
        )}
      </div>
      <div style={{ border: '1px solid var(--td-line)', borderRadius: 'var(--td-r-md)', background: 'var(--td-ground-soft)', padding: 18, marginBottom: 16 }}>
        <div style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 22, marginBottom: 12 }}>Photo of the finished repair</div>
        {cookPhoto ? (
          <EvidenceTile kind="repair" at={atLabel()} by="you" stageLabel="Cooked" where={job.site} width={150} height={104} />
        ) : (
          <button
            type="button"
            onClick={() => setCookPhoto(true)}
            style={{ width: '100%', minHeight: 104, border: '2px dashed var(--td-line-strong)', borderRadius: 'var(--td-r-md)', background: 'var(--td-paper)', cursor: 'pointer', display: 'grid', placeItems: 'center', fontSize: 17, fontWeight: 600, color: 'var(--td-ink-2)', padding: 14 }}
          >
            Tap to take the repair photo
          </button>
        )}
      </div>
    </>
  );
}

function DrawerShell({
  title, subtitle, onClose, children,
}: { title: string; subtitle: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="no-print" onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(17,28,36,.55)' }}>
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, width: 520, background: 'var(--td-paper)', boxShadow: '-18px 0 44px rgba(17,28,36,.34)',
          display: 'flex', flexDirection: 'column', animation: 'tdSlideIn 240ms cubic-bezier(.3,.9,.2,1) both',
        }}
      >
        <div style={{ background: 'var(--td-steel)', color: 'var(--td-steel-ink)', padding: '18px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#8fc0e8' }}>Stage action</span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{ marginLeft: 'auto', border: '1px solid rgba(234,243,248,.4)', background: 'transparent', color: 'var(--td-steel-ink)', borderRadius: 'var(--td-r-sm)', fontSize: 16, fontWeight: 600, padding: '7px 14px', cursor: 'pointer' }}
            >
              Close ✕
            </button>
          </div>
          <div style={{ fontFamily: 'var(--td-display)', fontWeight: 700, fontSize: 30, lineHeight: 1.05, marginTop: 8 }}>{title}</div>
          <div style={{ fontFamily: 'var(--td-mono)', fontSize: 15, color: '#8fc0e8', marginTop: 4 }}>{subtitle}</div>
        </div>
        {children}
      </div>
    </div>
  );
}
