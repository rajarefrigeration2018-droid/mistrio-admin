'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { dateShort, money } from '@/lib/format';
import { Card, ErrorNote, SectionHead, Skeleton } from '@/components/ui';

type Dash = {
  revenue: { today: number; week: number; month: number; all_time: number };
  bookings: {
    pending: number; confirmed: number; assigned: number; in_progress: number;
    completed: number; cancelled: number; today_total: number;
  };
  unassigned: number;
  people: {
    users: number; new_users: number; partners: number;
    pending_partners: number; online_partners: number;
  };
  money: { unsettled_earnings: number; payout_requests: number; payout_amount: number };
  top_services: { service_name: string; bookings: number; revenue: number }[];
  top_partners: { id: number; name: string; rating_avg: number; jobs: number; earned: number }[];
  low_stock: { id: number; name: string; stock_qty: number; min_stock_alert: number }[];
  daily_chart: { day: string; bookings: number; revenue: number }[];
};

export default function DashboardPage() {
  const [data, setData] = useState<Dash | null>(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError('');
    setRefreshing(true);
    try {
      setData(await api<Dash>('/admin/dashboard'));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  if (error && !data) {
    return (
      <div className="p-4 lg:p-8">
        <ErrorNote message={error} retry={load} />
      </div>
    );
  }

  if (!data) return <DashboardSkeleton />;

  const attention = [
    {
      count: data.unassigned,
      label: data.unassigned === 1 ? 'booking has no technician' : 'bookings have no technician',
      href: '/bookings?unassigned=1',
      tone: 'danger' as const,
    },
    {
      count: data.people.pending_partners,
      label: data.people.pending_partners === 1
        ? 'technician awaiting approval'
        : 'technicians awaiting approval',
      href: '/technicians?status=pending',
      tone: 'warn' as const,
    },
    {
      count: data.money.payout_requests,
      label: data.money.payout_requests === 1 ? 'payout to release' : 'payouts to release',
      href: '/payouts?status=requested',
      tone: 'warn' as const,
    },
    {
      count: data.low_stock.length,
      label: data.low_stock.length === 1 ? 'part is running low' : 'parts are running low',
      href: '/parts?low_stock=1',
      tone: 'info' as const,
    },
  ].filter((a) => a.count > 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 lg:px-8 lg:py-8">
      {/* ---------------- header ---------------- */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long', day: 'numeric', month: 'long',
            })}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight lg:text-3xl">
            {data.bookings.today_total > 0
              ? `${data.bookings.today_total} ${data.bookings.today_total === 1 ? 'job' : 'jobs'} today`
              : 'No jobs booked today'}
          </h1>
          <p className="mt-1 text-sm text-muted">
            <span className="num font-medium text-ink">{data.people.online_partners}</span>{' '}
            of {data.people.partners} technicians online
          </p>
        </div>
        <button
          onClick={load}
          aria-label="Refresh"
          className="press rounded-lg border border-line bg-white p-2.5"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ---------------- needs you now ---------------- */}
      {attention.length > 0 ? (
        <section className="mb-7">
          <SectionHead title="Needs you now" />
          <div className="space-y-2">
            {attention.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="press flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3.5 shadow-card hover:border-indigo"
              >
                <span
                  className={`num flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-lg font-semibold ${
                    a.tone === 'danger'
                      ? 'bg-red-50 text-danger'
                      : a.tone === 'warn'
                      ? 'bg-amber-wash text-amber-deep'
                      : 'bg-blue-50 text-info'
                  }`}
                >
                  {a.count}
                </span>
                <span className="flex-1 text-[15px]">{a.label}</span>
                <ArrowRight className="h-4 w-4 text-muted" />
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <section className="mb-7">
          <div className="rounded-xl border border-ok/20 bg-emerald-50 px-4 py-3.5">
            <p className="text-[15px] font-medium text-ok">Everything is handled.</p>
            <p className="mt-0.5 text-sm text-ok/80">
              No unassigned jobs, approvals or payouts waiting.
            </p>
          </div>
        </section>
      )}

      {/* ---------------- revenue ---------------- */}
      <section className="mb-7">
        <SectionHead title="Revenue" hint="Completed and paid jobs only" />
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <Metric label="Today" value={data.revenue.today} accent />
          <Metric label="This week" value={data.revenue.week} />
          <Metric label="This month" value={data.revenue.month} />
          <Metric label="All time" value={data.revenue.all_time} short />
        </div>
      </section>

      {/* ---------------- chart ---------------- */}
      {data.daily_chart.length > 1 && (
        <section className="mb-7">
          <SectionHead title="Last 30 days" />
          <Card className="p-4 pr-2">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.daily_chart} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1B2A5B" stopOpacity={0.22} />
                      <stop offset="100%" stopColor="#1B2A5B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    tickFormatter={dateShort}
                    tick={{ fontSize: 10, fill: '#6B7280' }}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={28}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#6B7280' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))}
                    width={44}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 10, border: '1px solid #E3E6EC',
                      fontSize: 12, boxShadow: '0 4px 16px rgba(15,21,35,.1)',
                    }}
                    labelFormatter={(d) => dateShort(d as string)}
                    formatter={(v: any, name) =>
                      name === 'revenue' ? [money(v), 'Revenue'] : [v, 'Bookings']
                    }
                  />
                  <Area
                    type="monotone" dataKey="revenue" stroke="#1B2A5B"
                    strokeWidth={2} fill="url(#rev)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </section>
      )}

      {/* ---------------- pipeline ---------------- */}
      <section className="mb-7">
        <SectionHead title="Pipeline" hint="Every booking on the board right now" />
        <Card className="divide-y divide-line">
          <PipelineRow label="Awaiting payment" count={data.bookings.pending} colour="#6B7280" href="/bookings?status=pending" />
          <PipelineRow label="Needs technician" count={data.bookings.confirmed} colour="#2563EB" href="/bookings?status=confirmed" />
          <PipelineRow label="Assigned" count={data.bookings.assigned} colour="#7C3AED" href="/bookings?status=assigned" />
          <PipelineRow label="Working" count={data.bookings.in_progress} colour="#F0790B" href="/bookings?status=in_progress" />
          <PipelineRow label="Done" count={data.bookings.completed} colour="#0E9F6E" href="/bookings?status=paid" />
          <PipelineRow label="Cancelled" count={data.bookings.cancelled} colour="#DC2626" href="/bookings?status=cancelled" />
        </Card>
      </section>

      {/* ---------------- leaders ---------------- */}
      <div className="grid gap-5 lg:grid-cols-2">
        <section>
          <SectionHead title="Most booked" hint="This month" />
          <Card className="divide-y divide-line">
            {data.top_services.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted">
                No completed jobs this month yet.
              </p>
            ) : (
              data.top_services.map((s) => (
                <div key={s.service_name} className="flex items-center gap-3 px-4 py-3">
                  <span className="flex-1 truncate text-sm">{s.service_name}</span>
                  <span className="num text-2xs text-muted">{s.bookings}×</span>
                  <span className="num text-sm font-medium">{money(s.revenue, true)}</span>
                </div>
              ))
            )}
          </Card>
        </section>

        <section>
          <SectionHead title="Top technicians" hint="This month" />
          <Card className="divide-y divide-line">
            {data.top_partners.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted">
                No jobs completed this month yet.
              </p>
            ) : (
              data.top_partners.map((p) => (
                <Link
                  key={p.id}
                  href={`/technicians/${p.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-paper"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-wash text-2xs font-semibold text-indigo">
                    {p.name?.charAt(0).toUpperCase() || 'T'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{p.name}</p>
                    <p className="num text-2xs text-muted">
                      {p.jobs} jobs · {p.rating_avg.toFixed(1)}★
                    </p>
                  </div>
                  <span className="num text-sm font-medium">{money(p.earned, true)}</span>
                </Link>
              ))
            )}
          </Card>
        </section>
      </div>

      {/* ---------------- pending money ---------------- */}
      {data.money.unsettled_earnings > 0 && (
        <section className="mt-7">
          <Card className="flex items-center gap-4 p-4">
            <div className="flex-1">
              <p className="eyebrow">Owed to technicians</p>
              <p className="num mt-1 text-2xl font-semibold">
                {money(data.money.unsettled_earnings)}
              </p>
              <p className="mt-0.5 text-xs text-muted">Earned but not yet paid out</p>
            </div>
            <Link
              href="/payouts"
              className="press rounded-lg border border-line px-3.5 py-2 text-sm font-medium hover:border-indigo"
            >
              Review
            </Link>
          </Card>
        </section>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- pieces */
function Metric({
  label, value, accent, short,
}: { label: string; value: number; accent?: boolean; short?: boolean }) {
  return (
    <div
      className={`rounded-xl border p-3.5 ${
        accent ? 'border-indigo bg-indigo text-white' : 'border-line bg-white shadow-card'
      }`}
    >
      <p className={`eyebrow ${accent ? 'text-white/55' : ''}`}>{label}</p>
      <p className="num mt-1.5 text-xl font-semibold tracking-tight lg:text-2xl">
        {money(value, short)}
      </p>
    </div>
  );
}

function PipelineRow({
  label, count, colour, href,
}: { label: string; count: number; colour: string; href: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-3 hover:bg-paper">
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: colour }} />
      <span className="flex-1 text-sm">{label}</span>
      <span className="num text-sm font-semibold">{count}</span>
      <ArrowRight className="h-3.5 w-3.5 text-muted" />
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-5 lg:px-8 lg:py-8">
      <Skeleton className="mb-2 h-3 w-32" />
      <Skeleton className="mb-6 h-8 w-52" />
      <div className="mb-7 space-y-2">
        <Skeleton className="h-[58px] w-full" />
        <Skeleton className="h-[58px] w-full" />
      </div>
      <div className="mb-7 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[86px]" />)}
      </div>
      <Skeleton className="h-56 w-full" />
    </div>
  );
}
