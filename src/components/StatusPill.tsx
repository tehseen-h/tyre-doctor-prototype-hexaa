import type { ReactNode } from 'react';

export function Pill({
  children, bg, color, border, weight = 700, size = 14,
}: { children: ReactNode; bg: string; color: string; border?: string; weight?: number; size?: number }) {
  return (
    <span style={{
      background: bg, color, border: border ? `1px solid ${border}` : undefined,
      borderRadius: 999, padding: '4px 12px', fontSize: size, fontWeight: weight, whiteSpace: 'nowrap', display: 'inline-block',
    }}
    >
      {children}
    </span>
  );
}

export function CategoryPill({ category }: { category?: string }) {
  if (!category) return null;
  return <Pill bg="var(--td-blue-tint)" color="var(--td-blue-deep)" weight={600}>{category}</Pill>;
}
