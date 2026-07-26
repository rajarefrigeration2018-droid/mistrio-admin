'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CalendarDays, MapPin, UserRound } from 'lucide-react';
import { api } from '@/lib/api';
import { dateShort, money, phone as fmtPhone } from '@/lib/format';
import { Card, Empty, ErrorNote, Rail, Skeleton, StatusChip } from '@/components/ui';
import { Chip, FilterChips, PageHead, Pager, SearchBar } from '@/components/list';

type Booking = {
  id: number;
  booking_code: string;
  status: string;
  scheduled_date: string;
  slot_label: string | null;
  total: number;
  payment_mode: string;
  payment_status: string;
  created_at: string;
  addr_snapshot: any;
  assigned_partner_id: number | null;
  user_name: string | null;
  user_phone: string;
  partner_name: string | null;
  services: string | null;
};

const FILTERS: Chip[] = [
  { value: '', label: 'All' },
  { value: 'unassigned', label: 'Needs technician' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'Working' },
  { value: 'paid', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
];

function BookingsList() {
  const params = useSearchParams();
  const [filter, setFilter] = useState(
    params.get('unassigned') ? 'unassigned' : params.get('status') || ''
  );
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [rows, setRows] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query: Record<string, any> = { page, limit: 20, search };
      if (filter === 'unassigned') query.unassigned = true;
      else if (filter) query.status = filter;

      const res = await api<{ items: Booking[]; total: number; total_pages: number }>(
        '/admin/bookings',
        { query }
      );
      setRows(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filter, search, page]);

  useEffect(() => {
    const t = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  useEffect(() => { setPage(1); }, [filter, search]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-5 lg:px-8 lg:py-8">
      <PageHead title="Bookings" count={total} />

      <div className="mb-4 space-y-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Booking code, name or phone"
        />
        <FilterChips options={FILTERS} value={filter} onChange={setFilter} />
      </div>

      {error && <ErrorNote message={error} retry={load} />}

      {loading ? (
        <div className="space-y-2.5">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[104px] w-full" />)}
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <Empty
            title="Nothing here"
            hint={
              filter === 'unassigned'
                ? 'Every booking has a technician. Good place to be.'
                : 'Bookings will appear here as customers place them.'
            }
          />
        </Card>
      ) : (
        <div className="space-y-2.5">
          {rows.map((b) => {
            const addr = b.addr_snapshot || {};
            const needsTech = !b.assigned_partner_id && b.status === 'confirmed';
            return (
              <Link key={b.id} href={`/bookings/${b.id}`} className="block">
                <Rail
                  value={b.status}
                  className="press rounded-xl border border-line bg-white py-3.5 pr-4 shadow-card hover:border-indigo"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="num text-sm font-semibold">{b.booking_code}</span>
                        <StatusChip value={b.status} />
                        {b.payment_status === 'paid' && (
                          <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-2xs font-semibold text-ok">
                            Paid
                          </span>
                        )}
                      </div>

                      <p className="mt-1 truncate text-[15px]">
                        {b.services || 'Service'}
                      </p>

                      <div className="mt-1.5 space-y-1 text-2xs text-muted">
                        <p className="flex items-center gap-1.5">
                          <UserRound className="h-3 w-3 shrink-0" />
                          <span className="truncate">
                            {b.user_name || 'Customer'} · <span className="num">{fmtPhone(b.user_phone)}</span>
                          </span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <CalendarDays className="h-3 w-3 shrink-0" />
                          <span className="num">{dateShort(b.scheduled_date)}</span>
                          {b.slot_label && <span>· {b.slot_label}</span>}
                        </p>
                        {(addr.area || addr.city) && (
                          <p className="flex items-center gap-1.5">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">
                              {[addr.area, addr.city].filter(Boolean).join(', ')}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="num text-[15px] font-semibold">{money(b.total)}</p>
                      <p className="mt-0.5 text-2xs uppercase text-muted">
                        {b.payment_mode}
                      </p>
                    </div>
                  </div>

                  {needsTech ? (
                    <p className="mt-2.5 rounded-md bg-red-50 px-2.5 py-1.5 text-2xs font-semibold text-danger">
                      No technician assigned
                    </p>
                  ) : b.partner_name ? (
                    <p className="mt-2.5 text-2xs text-muted">
                      Technician: <span className="font-medium text-ink">{b.partner_name}</span>
                    </p>
                  ) : null}
                </Rail>
              </Link>
            );
          })}
        </div>
      )}

      <Pager page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8"><Skeleton className="h-8 w-40" /></div>}>
      <BookingsList />
    </Suspense>
  );
}
