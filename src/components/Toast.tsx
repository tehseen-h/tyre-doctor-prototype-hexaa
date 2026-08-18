import { useEffect, useRef, useState } from 'react';
import { Button } from './Button';

export interface ToastState {
  message: string;
  undoable: boolean;
}

/** 5-second undo, implemented as a compensating event so history stays honest. */
export function useToast() {
  const [toast, setToast] = useState<(ToastState & { seconds: number }) | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | ReturnType<typeof setTimeout>>();

  const show = (message: string, undoable: boolean) => {
    if (timer.current) clearInterval(timer.current);
    setToast({ message, undoable, seconds: 5 });
    if (undoable) {
      timer.current = setInterval(() => {
        setToast((s) => {
          if (!s) return null;
          const seconds = s.seconds - 1;
          if (seconds <= 0) {
            if (timer.current) clearInterval(timer.current);
            return null;
          }
          return { ...s, seconds };
        });
      }, 1000);
    } else {
      timer.current = setTimeout(() => setToast(null), 4200);
    }
  };

  const dismiss = () => {
    if (timer.current) clearInterval(timer.current);
    setToast(null);
  };

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  return { toast, show, dismiss };
}

export function Toast({ toast, onUndo, onDismiss }: { toast: (ToastState & { seconds: number }) | null; onUndo: () => void; onDismiss: () => void }) {
  if (!toast) return null;
  return (
    <div
      role="status"
      className="no-print"
      style={{
        position: 'fixed', zIndex: 80, left: 24, bottom: 22, display: 'flex', alignItems: 'center', gap: 18,
        background: 'var(--td-steel)', color: 'var(--td-steel-ink)', padding: '15px 18px', borderRadius: 'var(--td-r-md)',
        boxShadow: 'var(--td-lift)', animation: 'tdRise 220ms ease-out both',
      }}
    >
      <span style={{ fontSize: 17 }}>{toast.message}</span>
      {toast.undoable && (
        <Button variant="steel-ghost" onClick={onUndo} style={{ padding: '9px 15px', fontSize: 16, fontWeight: 600 }}>
          Undo · {toast.seconds}s
        </Button>
      )}
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        style={{ border: 'none', background: 'transparent', color: '#8fc0e8', fontSize: 18, cursor: 'pointer' }}
      >
        ✕
      </button>
    </div>
  );
}
