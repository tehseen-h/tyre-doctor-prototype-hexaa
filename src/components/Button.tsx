import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, CSSProperties } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'hazard' | 'pass' | 'fail' | 'steel-ghost';
type Size = 'md' | 'lg' | 'xl';

const VARIANT_STYLE: Record<Variant, CSSProperties> = {
  primary: { border: 'none', background: 'var(--td-blue)', color: '#fff', boxShadow: '0 8px 20px rgba(13,100,173,.28)' },
  secondary: { border: '1px solid var(--td-line-strong)', background: 'var(--td-paper)', color: 'var(--td-ink)' },
  ghost: { border: 'none', background: 'transparent', color: 'var(--td-ink-2)' },
  hazard: { border: 'none', background: 'var(--td-hazard)', color: 'var(--td-hazard-ink)', boxShadow: '0 7px 16px rgba(245,163,0,.36)' },
  pass: { border: 'none', background: 'var(--td-pass)', color: '#fff' },
  fail: { border: '2px solid var(--td-fail)', background: 'var(--td-fail)', color: '#fff' },
  'steel-ghost': { border: '1px solid rgba(234,243,248,.34)', background: 'transparent', color: 'var(--td-steel-ink)' },
};

const SIZE_STYLE: Record<Size, CSSProperties> = {
  md: { fontSize: 16, fontWeight: 600, padding: '12px 18px', borderRadius: 'var(--td-r-md)' },
  lg: { fontSize: 18, fontWeight: 700, padding: '15px 22px', borderRadius: 'var(--td-r-md)' },
  xl: { fontSize: 21, fontWeight: 700, padding: '18px 30px', borderRadius: 'var(--td-r-md)' },
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'secondary', size = 'md', style, disabled, ...rest
}, ref) => {
  return (
    <button
      ref={ref}
      {...rest}
      disabled={disabled}
      style={{
        ...VARIANT_STYLE[variant],
        ...SIZE_STYLE[size],
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        ...style,
      }}
    />
  );
});
