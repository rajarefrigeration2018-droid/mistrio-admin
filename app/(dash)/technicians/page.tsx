'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CircleDot, MapPin } from 'lucide-react';
import { api } from '@/lib/api';
import { money, phone as fmtPhone, timeAgo } from '@/lib/format';
import { Card, Empty, ErrorNote, Rail, Skeleton, StatusChip } from '@/components/ui';
import { Chip, FilterChips, PageHead, Pager, SearchBar } from '@/components/list';

type Tech = {
  id: number;
  name: string | null;
  phone: string;
  photo: string | null;
  status: string;
  is_online: boolean;
  skills: number[];
  service_area_pincodes: string[];
  rating_avg: number;
  rating_count: number;
  jobs_completed: number;
  total_earned: number;
  doc_count: number;
  created_at: string;
  approved_at: string | null;
};

const FILTERS: Chip[] = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Awaiting approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'suspended', label: 'Suspended' },
];

function TechniciansList() {
  const params = useSearchParams();
  const [status, setStatus] = useState(params.get('status') || '');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [rows, setRows] = useState<Tech[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api<{
        items: Tech[]; total: number; total_pages: number;
      }>('/admin/partners', { query: { status, search, page, limit: 20 } });
      setRows(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [status, search, page]);

  useEffect(() => {
    const t = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  useEffect(() => { setPage(1); }, [status, search]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-5 lg:px-8 lg:py-8">
      <PageHead title="Technicians" count={total} />

      <div className="mb-4 space-y-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Name or phone number" />
        <FilterChips options={FILTERS} value={status} onChange={setStatus} />
      </div>

      {error && <ErrorNote message={error} retry={load} />}

      {loading ? (
        <div className="space-y-2.5">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[92px] w-full" />)}
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <Empty
            title="No technicians here"
            hint={
              status === 'pending'
                ? 'Nobody is waiting for approval right now.'
                : 'Technicians appear here after they register in the partner app.'
            }
          />
        </Card>
      ) : (
        <div className="space-y-2.5">
          {rows.map((t) => (
            <Link key={t.id} href={`/technicians/${t.id}`} className="block">
              <Rail
                value={t.status}
                className="press rounded-xl border border-line bg-white py-3.5 pr-4 shadow-card hover:border-indigo"
              >
                <div className="flex items-start gap-3">
                  <Avatar name={t.name} photo={t.photo} online={t.is_online} />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">
                        {t.name || 'Registration incomplete'}
                      </p>
                      <StatusChip value={t.status} />
                    </div>

                    <p className="num mt-0.5 text-sm text-muted">{fmtPhone(t.phone)}</p>

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs text-muted">
                      {t.status === 'approved' ? (
                        <>
                          <span className="num">
                            {t.jobs_completed} {t.jobs_completed === 1 ? 'job' : 'jobs'}
                          </span>
                          {t.rating_count > 0 && (
                            <span className="num">
                              {t.rating_avg.toFixed(1)}★ ({t.rating_count})
                            </span>
                          )}
                          <span className="num">{money(t.total_earned, true)} earned</span>
                        </>
                      ) : (
                        <>
                          <span>Registered {timeAgo(t.created_at)}</span>
                          <span className="num">
                            {t.doc_count} {t.doc_count === 1 ? 'document' : 'documents'}
                          </span>
                        </>
                      )}
                      {t.service_area_pincodes.length > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="num">{t.service_area_pincodes.length}</span> areas
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Rail>
            </Link>
          ))}
        </div>
      )}

      <Pager page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}

function Avatar({
  name, photo, online,
}: { name: string | null; photo: string | null; online: boolean }) {
  return (
    <div className="relative shrink-0">
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt="" className="h-11 w-11 rounded-full object-cover" />
      ) : (
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-wash font-semibold text-indigo">
          {(name || '?').charAt(0).toUpperCase()}
        </div>
      )}
      {online && (
        <CircleDot
          className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-white text-ok"
          strokeWidth={3}
        />
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8"><Skeleton className="h-8 w-40" /></div>}>
      <TechniciansList />
    </Suspense>
  );
}
