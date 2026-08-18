// The tyre-edged card — DESIGN.md's one idea at three scales.
import type { CSSProperties, ReactNode } from 'react';

const TREAD = (height: number) => `repeating-linear-gradient(96deg, var(--td-lug) 0 8px, var(--td-rubber) 8px 19px) top/100% ${height}px no-repeat`;
const TREAD_BOTTOM = (height: number) => `repeating-linear-gradient(96deg, var(--td-lug) 0 8px, var(--td-rubber) 8px 19px) bottom/100% ${height}px no-repeat`;

export function Card({
  variant = 'reduced', children, style, className,
}: { variant?: 'hero' | 'reduced' | 'row' | 'plain'; children: ReactNode; style?: CSSProperties; className?: string }) {
  let background: string;
  let borderRadius: string;
  if (variant === 'hero') {
    background = `${TREAD(16)}, ${TREAD_BOTTOM(16)}, var(--td-paper)`;
    borderRadius = 'var(--td-r-lg)';
  } else if (variant === 'reduced') {
    background = `${TREAD(14)}, var(--td-paper)`;
    borderRadius = 'var(--td-r-lg)';
  } else if (variant === 'row') {
    background = 'repeating-linear-gradient(180deg, var(--td-lug) 0 7px, var(--td-rubber) 7px 16px) left/7px 100% no-repeat, var(--td-paper)';
    borderRadius = 'var(--td-r-md)';
  } else {
    background = 'var(--td-paper)';
    borderRadius = 'var(--td-r-lg)';
  }
  return (
    <div
      className={className}
      style={{
        borderRadius, background, border: '1px solid var(--td-line)', boxShadow: 'var(--td-card)', ...style,
      }}
    >
      {children}
    </div>
  );
}
