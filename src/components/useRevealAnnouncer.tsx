import {
  useCallback, useEffect, useRef, useState,
} from 'react';

const srOnly: React.CSSProperties = {
  position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden',
  clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0,
};

/**
 * The five scroll-into-view + focus + announce moments (PRD §9): each moves
 * the view to newly revealed content, moves keyboard focus to it, announces
 * via aria-live="polite", and jumps instantly under prefers-reduced-motion.
 */
export function useRevealAnnouncer() {
  const [message, setMessage] = useState('');
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const reveal = useCallback((el: HTMLElement | null, msg: string) => {
    if (!el) return;
    el.scrollIntoView({ behavior: reduced.current ? 'auto' : 'smooth', block: 'center' });
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    // Focus after the scroll settles so the browser doesn't fight the smooth-scroll.
    setTimeout(() => el.focus({ preventScroll: true }), reduced.current ? 0 : 260);
    setMessage(msg);
  }, []);

  const liveRegion = <div aria-live="polite" role="status" style={srOnly}>{message}</div>;

  return { reveal, liveRegion };
}
