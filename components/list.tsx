// components/list.tsx
'use client';

import { ReactNode, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';

/* ---------------------------------------------------------------- Page head */
export function PageHead({
  title, count, children,
}: { title: string; count?: number; children?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">{title}</h1>
        {count !== undefined && (
          <p className="num mt-0.5 text-sm text-muted">
            {count.toLocaleString('en-IN')} total
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------- Search */
export function SearchBar({
  value, onChange, placeholder = 'Search',
}: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-lg border border-line bg-white pl-9 pr-9 text-[15px] placeholder:text-muted/70 focus:border-indigo"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- Filters */
export type Chip = { value: string; label: string; count?: number };

export function FilterChips({
  options, value, onChange,
}: { options: Chip[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`press shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium ${
              on
                ? 'border-indigo bg-indigo text-white'
                : 'border-line bg-white text-ink/70 hover:border-indigo'
            }`}
          >
            {o.label}
            {o.count !== undefined && (
              <span className={`num ml-1.5 ${on ? 'text-white/70' : 'text-muted'}`}>
                {o.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------- Paging */
export function Pager({
  page, totalPages, onChange,
}: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-5 flex items-center justify-center gap-2">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className="press rounded-lg border border-line bg-white p-2.5 disabled:opacity-35"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="num px-2 text-sm text-muted">
        {page} / {totalPages}
      </span>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
        className="press rounded-lg border border-line bg-white p-2.5 disabled:opacity-35"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------- Sheet */
/** Bottom sheet on mobile, centred dialog on desktop. */
export function Sheet({
  open, onClose, title, children, footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center">
      <div className="absolute inset-0 bg-ink/45" onClick={onClose} />
      <div className="relative flex max-h-[88dvh] w-full flex-col rounded-t-2xl bg-white lg:max-w-lg lg:rounded-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-[17px] font-semibold tracking-tight">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="-mr-1.5 p-1.5 text-muted">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="border-t border-line px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Toast */
export function Toast({
  message, tone = 'ok', onDone,
}: { message: string; tone?: 'ok' | 'danger'; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed bottom-24 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 lg:bottom-8">
      <div
        className={`rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lift ${
          tone === 'ok' ? 'bg-ink' : 'bg-danger'
        }`}
      >
        {message}
      </div>
    </div>
  );
}
