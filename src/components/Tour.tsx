import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from './Button';

export interface TourStep {
  ref: string;
  text: string;
}

interface TourRect {
  x: number; y: number; w: number; h: number; cardX: number; cardY: number;
}

export function useTour(steps: TourStep[]) {
  const refs = useRef<Record<string, HTMLElement | null>>({});
  const [step, setStep] = useState(-1);
  const [rect, setRect] = useState<TourRect | null>(null);
  const reducedRef = useRef(false);

  useEffect(() => {
    reducedRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const setRef = useCallback((key: string) => (el: HTMLElement | null) => {
    refs.current[key] = el;
  }, []);

  const measure = useCallback((i: number) => {
    const el = refs.current[steps[i]?.ref];
    if (!el || !el.isConnected) {
      setStep(-1);
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    if (r.width < 20) {
      setStep(-1);
      setRect(null);
      return;
    }
    const cardX = Math.min(Math.max(14, r.left + 16), window.innerWidth - 384);
    const below = r.bottom + 18 + 220 < window.innerHeight;
    setStep(i);
    setRect({
      x: r.left - 7, y: r.top - 7, w: r.width + 14, h: r.height + 14,
      cardX, cardY: below ? r.bottom + 18 : Math.max(14, r.top + 26),
    });
  }, [steps]);

  const start = useCallback(() => {
    window.scrollTo({ top: 0 });
    requestAnimationFrame(() => measure(0));
  }, [measure]);

  const next = useCallback(() => {
    const n = step + 1;
    if (n >= steps.length) {
      setStep(-1);
      setRect(null);
      return;
    }
    const el = refs.current[steps[n]?.ref];
    if (el) {
      const r = el.getBoundingClientRect();
      if (r.bottom > window.innerHeight - 40 || r.top < 90) {
        window.scrollBy({ top: r.top - 150, behavior: reducedRef.current ? 'auto' : 'smooth' });
      }
    }
    setTimeout(() => measure(n), reducedRef.current ? 0 : 400);
  }, [step, steps, measure]);

  const end = useCallback(() => {
    setStep(-1);
    setRect(null);
  }, []);

  return {
    setRef, step, rect, start, next, end, active: step >= 0 && !!rect, total: steps.length, text: step >= 0 ? steps[step]?.text : '',
  };
}

export function TourOverlay({
  step, rect, total, text, onNext, onEnd,
}: { step: number; rect: { x: number; y: number; w: number; h: number; cardX: number; cardY: number } | null; total: number; text: string; onNext: () => void; onEnd: () => void }) {
  if (!rect) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
      <div
        onClick={onEnd}
        style={{
          position: 'absolute', left: rect.x, top: rect.y, width: rect.w, height: rect.h, borderRadius: 'var(--td-r-md)',
          boxShadow: '0 0 0 9999px rgba(17,28,36,.66)', border: '3px solid var(--td-hazard)', transition: 'all 300ms cubic-bezier(.3,.9,.2,1)',
        }}
      />
      <div style={{ position: 'absolute', left: rect.cardX, top: rect.cardY, width: 364, background: 'var(--td-paper)', borderRadius: 'var(--td-r-lg)', padding: 22, boxShadow: 'var(--td-lift)' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--td-blue-deep)', marginBottom: 8 }}>Step {step + 1} of {total}</div>
        <div style={{ fontFamily: 'var(--td-display)', fontWeight: 600, fontSize: 27, lineHeight: 1.12, marginBottom: 16 }}>{text}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button variant="primary" size="lg" onClick={onNext}>{step === total - 1 ? 'Done' : 'Next'}</Button>
          <Button variant="ghost" onClick={onEnd}>Skip</Button>
        </div>
      </div>
    </div>
  );
}
