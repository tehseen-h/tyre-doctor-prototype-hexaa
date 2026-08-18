import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { store } from '../data/store';
import { intakeState } from '../data/intakeState';

/** Unobtrusive control so the walkthrough can be replayed cleanly (PRD §9). No
 * native confirm() — a second tap within 4s arms it, matching the toast/undo
 * pattern used everywhere else instead of a browser dialog. */
export function ResetDemo({ dark }: { dark?: boolean }) {
  const navigate = useNavigate();
  const [armed, setArmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const onClick = () => {
    if (!armed) {
      setArmed(true);
      timer.current = setTimeout(() => setArmed(false), 4000);
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    store.reset();
    intakeState.reset();
    setArmed(false);
    navigate('/');
  };

  return (
    <button
      type="button"
      onClick={onClick}
      title="Put every job, quote and intake row back to its starting state"
      style={{
        border: `1px solid ${armed ? 'var(--td-hazard)' : dark ? 'rgba(234,243,248,.34)' : 'var(--td-line-strong)'}`,
        background: armed ? 'var(--td-hazard-tint)' : 'transparent',
        color: armed ? 'var(--td-hazard-deep)' : (dark ? 'var(--td-steel-ink)' : 'var(--td-ink-2)'),
        borderRadius: 'var(--td-r-sm)', fontSize: 14, fontWeight: 600, padding: '7px 13px', cursor: 'pointer', whiteSpace: 'nowrap',
      }}
    >
      {armed ? 'Tap again to reset' : 'Reset demo'}
    </button>
  );
}
