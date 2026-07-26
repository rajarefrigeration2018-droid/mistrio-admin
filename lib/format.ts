// lib/format.ts — display helpers shared across the console.

export function money(n: number | string | null | undefined, short = false): string {
  const v = Number(n || 0);
  if (short) {
    if (Math.abs(v) >= 10000000) return `₹${(v / 10000000).toFixed(2)}Cr`;
    if (Math.abs(v) >= 100000) return `₹${(v / 100000).toFixed(2)}L`;
    if (Math.abs(v) >= 1000) return `₹${(v / 1000).toFixed(1)}k`;
  }
  return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export function dateShort(d: string | Date | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export function dateFull(d: string | Date | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function timeAgo(d: string | Date | null | undefined): string {
  if (!d) return '—';
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return dateShort(d);
}

export function phone(p: string | null | undefined): string {
  if (!p) return '—';
  const d = p.replace(/\D/g, '').slice(-10);
  return d.length === 10 ? `${d.slice(0, 5)} ${d.slice(5)}` : p;
}

/** Status vocabulary. The label is what an operator would say out loud. */
export const STATUS: Record<string, { label: string; rail: string; chip: string }> = {
  pending:            { label: 'Awaiting payment', rail: '#6B7280', chip: 'bg-gray-100 text-gray-700' },
  confirmed:          { label: 'Needs technician', rail: '#2563EB', chip: 'bg-blue-50 text-blue-700' },
  assigned:           { label: 'Assigned',         rail: '#7C3AED', chip: 'bg-violet-50 text-violet-700' },
  partner_on_the_way: { label: 'On the way',       rail: '#0891B2', chip: 'bg-cyan-50 text-cyan-700' },
  arrived:            { label: 'Arrived',          rail: '#0891B2', chip: 'bg-cyan-50 text-cyan-700' },
  in_progress:        { label: 'Working',          rail: '#F0790B', chip: 'bg-orange-50 text-orange-700' },
  completed:          { label: 'Done',             rail: '#0E9F6E', chip: 'bg-emerald-50 text-emerald-700' },
  paid:               { label: 'Paid',             rail: '#0E9F6E', chip: 'bg-emerald-50 text-emerald-700' },
  cancelled:          { label: 'Cancelled',        rail: '#DC2626', chip: 'bg-red-50 text-red-700' },
  rejected:           { label: 'Rejected',         rail: '#DC2626', chip: 'bg-red-50 text-red-700' },
  rescheduled:        { label: 'Rescheduled',      rail: '#6B7280', chip: 'bg-gray-100 text-gray-700' },
  // parts orders
  placed:    { label: 'Placed',    rail: '#2563EB', chip: 'bg-blue-50 text-blue-700' },
  packed:    { label: 'Packed',    rail: '#7C3AED', chip: 'bg-violet-50 text-violet-700' },
  shipped:   { label: 'Shipped',   rail: '#0891B2', chip: 'bg-cyan-50 text-cyan-700' },
  delivered: { label: 'Delivered', rail: '#0E9F6E', chip: 'bg-emerald-50 text-emerald-700' },
  returned:  { label: 'Returned',  rail: '#F0790B', chip: 'bg-orange-50 text-orange-700' },
  // technicians
  approved:  { label: 'Approved',  rail: '#0E9F6E', chip: 'bg-emerald-50 text-emerald-700' },
  suspended: { label: 'Suspended', rail: '#DC2626', chip: 'bg-red-50 text-red-700' },
};

export function status(key: string | null | undefined) {
  return STATUS[key || ''] || { label: key || '—', rail: '#E3E6EC', chip: 'bg-gray-100 text-gray-700' };
}
