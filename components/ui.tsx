// components/ui.tsx
'use client';

import { ReactNode } from 'react';
import { status as statusMeta } from '@/lib/format';

/* ---------------------------------------------------------------- Button */
type ButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md';
  disabled?: boolean;
  loading?: boolean;
  full?: boolean;
  className?: string;
};

export function Button({
  children, onClick, type = 'button', variant = 'primary',
  size = 'md', disabled, loading, full, className = '',
}: ButtonProps) {
  const base =
    'press inline-flex items-center justify-center gap-2 rounded-lg font-medium disabled:opacity-40 disabled:pointer-events-none';
  const sizes = { sm: 'h-9 px-3 text-sm', md: 'h-11 px-4 text-[15px]' };
  const variants = {
    primary: 'bg-indigo text-white hover:bg-indigo-soft',
    outline: 'border border-line bg-white text-ink hover:border-indigo',
    ghost: 'text-indigo hover:bg-indigo-wash',
    danger: 'bg-danger text-white hover:brightness-95',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${sizes[size]} ${variants[variant]} ${full ? 'w-full' : ''} ${className}`}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
  );
}

/* ---------------------------------------------------------------- Card */
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function SectionHead({
  title, hint, action,
}: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
        {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

/* ---------------------------------------------------------------- Status */
export function StatusChip({ value }: { value: string | null | undefined }) {
  const s = statusMeta(value);
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-2xs font-semibold ${s.chip}`}>
      {s.label}
    </span>
  );
}

/** The signature element: a status-coloured rail down the left of a row. */
export function Rail({
  value, children, className = '',
}: { value: string | null | undefined; children: ReactNode; className?: string }) {
  const s = statusMeta(value);
  return (
    <div
      className={`rail ${className}`}
      style={{ ['--rail' as any]: s.rail }}
    >
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------- States */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-line/70 ${className}`} />;
}

export function Empty({
  title, hint, action,
}: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <p className="text-[15px] font-medium">{title}</p>
      {hint && <p className="mt-1 max-w-xs text-sm text-muted">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorNote({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="rounded-xl border border-danger/25 bg-red-50 px-4 py-3">
      <p className="text-sm font-medium text-danger">{message}</p>
      {retry && (
        <button onClick={retry} className="mt-2 text-sm font-semibold text-danger underline">
          Try again
        </button>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- Fields */
export function Field({
  label, children, hint,
}: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="eyebrow">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </label>
  );
}

export const inputClass =
  'w-full rounded-lg border border-line bg-white px-3 h-11 text-[15px] placeholder:text-muted/70 focus:border-indigo';
