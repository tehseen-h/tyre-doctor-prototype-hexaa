// Lets a routed page inject its own middle/right header controls into the ONE
// persistent header instance in WorkshopLayout, without remounting the header
// itself when navigating between console / job file / rim / performance.
//
// Implemented with portals into stable DOM nodes (set once, via ref callback)
// rather than lifting rendered JSX through React context state — the latter
// re-renders the whole subtree (including the routed page) on every update,
// which recreates the JSX and re-triggers the update: an infinite loop.
import {
  createContext, useContext, useState, type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

interface SlotEls {
  middleEl: HTMLDivElement | null;
  rightEl: HTMLDivElement | null;
}

const HeaderSlotContext = createContext<SlotEls>({ middleEl: null, rightEl: null });

export function HeaderSlotProvider({
  children,
}: { children: (setMiddleEl: (el: HTMLDivElement | null) => void, setRightEl: (el: HTMLDivElement | null) => void) => ReactNode }) {
  const [middleEl, setMiddleEl] = useState<HTMLDivElement | null>(null);
  const [rightEl, setRightEl] = useState<HTMLDivElement | null>(null);
  return (
    <HeaderSlotContext.Provider value={{ middleEl, rightEl }}>
      {children(setMiddleEl, setRightEl)}
    </HeaderSlotContext.Provider>
  );
}

/** Render this anywhere in a page's own JSX — it portals into the persistent header. */
export function HeaderSlot({ middle, right }: { middle?: ReactNode; right?: ReactNode }) {
  const { middleEl, rightEl } = useContext(HeaderSlotContext);
  return (
    <>
      {middle && middleEl ? createPortal(middle, middleEl) : null}
      {right && rightEl ? createPortal(right, rightEl) : null}
    </>
  );
}
