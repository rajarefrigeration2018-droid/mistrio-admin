'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Download, MapPin, Phone, Sparkles, UserRoundPlus,
} from 'lucide-react';
import { api } from '@/lib/api';
import { dateFull, money, phone as fmtPhone, timeAgo } from '@/lib/format';
import {
  Button, Card, ErrorNote, Field, Rail, SectionHead, Skeleton, StatusChip, inputClass,
} from '@/components/ui';
import { Sheet, Toast } from '@/components/list';

type Detail = {
  booking: any;
  items: any[];
  extra_charges: any[];
  timeline: { status: string; actor: string; note: string | null; created_at: string }[];
  offers: any[];
  earning: any | null;
  payment: any | null;
  review: any | null;
  start_otp: string | null;
};

type Candidate = {
  id: number;
  name: string;
  phone: string;
  rating_avg: number;
  jobs_completed: number;
  distance_km: number;
  active_jobs: number;
};

export default function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ msg: string; tone: 'ok' | 'danger' } | null>(null);

  const [assignOpen, setAssignOpen] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [chargeOpen, setChargeOpen] = useState(false);
  const [chargeLabel, setChargeLabel] = useState('');
  const [chargeAmount, setChargeAmount] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setData(await api<Detail>(`/admin/bookings/${id}`));
    } catch (e: any) {
      setError(e.message);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function openAssign() {
    setAssignOpen(true);
    setCandidates(null);
    try {
      setCandidates(await api<Candidate[]>(`/admin/bookings/${id}/candidates`));
    } catch (e: any) {
      setToast({ msg: e.message, tone: 'danger' });
      setCandidates([]);
    }
  }

  async function assign(partnerId: number) {
    setBusy(true);
    try {
      await api(`/admin/bookings/${id}/assign`, {
        method: 'POST',
        body: { partner_id: partnerId },
      });
      setToast({ msg: 'Technician assigned', tone: 'ok' });
      setAssignOpen(false);
      await load();
    } catch (e: any) {
      setToast({ msg: e.message, tone: 'danger' });
    } finally {
      setBusy(false);
    }
  }

  async function autoAssign() {
    setBusy(true);
    try {
      const res = await api<{ offered: number }>(`/admin/bookings/${id}/auto-assign`, {
        method: 'POST',
      });
      setToast({ msg: `Offered to ${res.offered} technicians`, tone: 'ok' });
      await load();
    } catch (e: any) {
      setToast({ msg: e.message, tone: 'danger' });
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    setBusy(true);
    try {
      await api(`/admin/bookings/${id}/cancel`, {
        method: 'POST',
        body: { reason: cancelReason.trim(), refund_to_wallet: true },
      });
      setToast({ msg: 'Booking cancelled', tone: 'ok' });
      setCancelOpen(false);
      await load();
    } catch (e: any) {
      setToast({ msg: e.message, tone: 'danger' });
    } finally {
      setBusy(false);
    }
  }

  async function addCharge() {
    setBusy(true);
    try {
      await api(`/admin/bookings/${id}/charges`, {
        method: 'POST',
        body: { label: chargeLabel.trim(), amount: Number(chargeAmount) },
      });
      setToast({ msg: 'Charge added', tone: 'ok' });
      setChargeOpen(false);
      setChargeLabel('');
      setChargeAmount('');
      await load();
    } catch (e: any) {
      setToast({ msg: e.message, tone: 'danger' });
    } finally {
      setBusy(false);
    }
  }

  async function invoice() {
    setBusy(true);
    try {
      const res = await api<{ invoice_url: string }>(`/admin/bookings/${id}/invoice`, {
        method: 'POST',
      });
      window.open(res.invoice_url, '_blank');
    } catch (e: any) {
      setToast({ msg: e.message, tone: 'danger' });
    } finally {
      setBusy(false);
    }
  }

  if (error && !data) {
    return <div className="p-4 lg:p-8"><ErrorNote message={error} retry={load} /></div>;
  }
  if (!data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-5 lg:px-8">
        <Skeleton className="mb-4 h-6 w-24" />
        <Skeleton className="mb-3 h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const b = data.booking;
  const addr = b.addr_snapshot || {};
  const fullAddress = [addr.house, addr.area, addr.landmark, addr.city, addr.pincode]
    .filter(Boolean)
    .join(', ');
  const isOpen = !['completed', 'paid', 'cancelled', 'rejected'].includes(b.status);
  const needsTech = !b.assigned_partner_id && b.status === 'confirmed';

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 lg:px-8 lg:py-8">
      <button
        onClick={() => router.push('/bookings')}
        className="press mb-4 inline-flex items-center gap-1.5 text-sm text-muted"
      >
        <ArrowLeft className="h-4 w-4" />
        All bookings
      </button>

      {/* ---------------- header ---------------- */}
      <Rail value={b.status} className="mb-4 rounded-xl border border-line bg-white py-4 pr-4 shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="num text-xl font-semibold tracking-tight">{b.booking_code}</h1>
              <StatusChip value={b.status} />
            </div>
            <p className="mt-1 text-sm text-muted">
              <span className="num">{dateFull(b.scheduled_date)}</span>
              {b.slot_label && ` · ${b.slot_label}`}
            </p>
            <p className="mt-0.5 text-xs text-muted">Placed {timeAgo(b.created_at)}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="num text-xl font-semibold">{money(b.total)}</p>
            <p className="mt-0.5 text-2xs uppercase text-muted">
              {b.payment_mode} · {b.payment_status}
            </p>
          </div>
        </div>
      </Rail>

      {/* ---------------- assignment ---------------- */}
      {needsTech && (
        <Card className="mb-4 border-danger/30 bg-red-50 p-4">
          <p className="font-medium text-danger">No technician assigned</p>
          <p className="mt-0.5 text-sm text-danger/80">
            Auto-assign either found nobody nearby or everyone declined.
          </p>
          <div className="mt-3.5 flex gap-2.5">
            <Button onClick={openAssign} full>
              <UserRoundPlus className="h-4 w-4" />
              Pick manually
            </Button>
            <Button variant="outline" onClick={autoAssign} loading={busy} full>
              <Sparkles className="h-4 w-4" />
              Retry auto
            </Button>
          </div>
        </Card>
      )}

      {b.assigned_partner_id && (
        <Card className="mb-4 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-wash font-semibold text-indigo">
              {(b.partner_name || 'T').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="eyebrow">Technician</p>
              <Link
                href={`/technicians/${b.assigned_partner_id}`}
                className="font-medium text-indigo"
              >
                {b.partner_name}
              </Link>
              <a
                href={`tel:${b.partner_phone}`}
                className="num mt-0.5 flex items-center gap-1.5 text-sm text-muted"
              >
                <Phone className="h-3 w-3" />
                {fmtPhone(b.partner_phone)}
              </a>
            </div>
            {isOpen && (
              <button
                onClick={openAssign}
                className="press rounded-lg border border-line px-3 py-1.5 text-sm font-medium"
              >
                Change
              </button>
            )}
          </div>

          {data.start_otp && ['assigned', 'partner_on_the_way', 'arrived'].includes(b.status) && (
            <div className="mt-3.5 rounded-lg bg-amber-wash px-3 py-2.5">
              <p className="eyebrow text-amber-deep">Start code</p>
              <p className="num text-2xl font-semibold tracking-[0.2em] text-amber-deep">
                {data.start_otp}
              </p>
              <p className="mt-0.5 text-2xs text-ink/60">
                The customer gives this to the technician to start work. Share it only if
                the customer cannot find it in their app.
              </p>
            </div>
          )}
        </Card>
      )}

      {/* ---------------- customer ---------------- */}
      <section className="mb-5">
        <SectionHead title="Customer" />
        <Card className="p-4">
          <p className="font-medium">{b.user_name || 'Customer'}</p>
          <a
            href={`tel:${b.user_phone}`}
            className="num mt-1 inline-flex items-center gap-1.5 text-sm text-indigo"
          >
            <Phone className="h-3.5 w-3.5" />
            {fmtPhone(b.user_phone)}
          </a>
          {fullAddress && (
            <div className="mt-3 flex gap-2 border-t border-line pt-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
              <div className="flex-1">
                <p className="text-sm">{fullAddress}</p>
                {addr.lat && (
                  <a
                    href={`https://maps.google.com/?q=${addr.lat},${addr.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-2xs font-medium text-indigo underline"
                  >
                    Open in Maps
                  </a>
                )}
              </div>
            </div>
          )}
          {b.user_notes && (
            <div className="mt-3 border-t border-line pt-3">
              <p className="eyebrow">Customer note</p>
              <p className="mt-0.5 text-sm">{b.user_notes}</p>
            </div>
          )}
        </Card>
      </section>

      {/* ---------------- bill ---------------- */}
      <section className="mb-5">
        <SectionHead
          title="Bill"
          action={
            isOpen ? (
              <button
                onClick={() => setChargeOpen(true)}
                className="press text-sm font-medium text-indigo"
              >
                Add charge
              </button>
            ) : undefined
          }
        />
        <Card>
          <div className="divide-y divide-line">
            {data.items.map((i) => (
              <div key={i.id} className="flex items-start gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    {i.service_name}
                    {i.option_name && (
                      <span className="text-muted"> · {i.option_name}</span>
                    )}
                  </p>
                  <p className="num text-2xs text-muted">
                    {i.qty} × {money(i.unit_price)}
                  </p>
                </div>
                <span className="num text-sm">{money(i.line_total)}</span>
              </div>
            ))}

            {data.extra_charges.map((e) => (
              <div key={e.id} className="flex items-start gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{e.label}</p>
                  <p className="text-2xs text-muted">
                    {e.rejected
                      ? 'Rejected by customer'
                      : e.approved_by_user
                      ? 'Approved by customer'
                      : 'Waiting for customer approval'}
                  </p>
                </div>
                <span
                  className={`num text-sm ${
                    e.rejected ? 'text-muted line-through' : ''
                  }`}
                >
                  {money(e.amount)}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-1.5 border-t border-line px-4 py-3">
            <Line label="Item total" value={money(b.subtotal)} />
            {b.extra_charges_total > 0 && (
              <Line label="Extra charges" value={money(b.extra_charges_total)} />
            )}
            {b.visit_charge > 0 && <Line label="Visit charge" value={money(b.visit_charge)} />}
            {b.discount > 0 && (
              <Line
                label={b.coupon_code ? `Discount (${b.coupon_code})` : 'Discount'}
                value={`− ${money(b.discount)}`}
                good
              />
            )}
            {b.tax > 0 && <Line label="GST" value={money(b.tax)} />}
            <div className="flex justify-between border-t border-line pt-2 text-[15px] font-semibold">
              <span>Total</span>
              <span className="num">{money(b.total)}</span>
            </div>
          </div>
        </Card>

        {['completed', 'paid'].includes(b.status) && (
          <Button variant="outline" size="sm" className="mt-2.5" loading={busy} onClick={invoice}>
            <Download className="h-4 w-4" />
            Invoice PDF
          </Button>
        )}
      </section>

      {/* ---------------- earning ---------------- */}
      {data.earning && (
        <section className="mb-5">
          <SectionHead title="Technician payout" />
          <Card className="p-4">
            <div className="space-y-1.5">
              <Line label="Job value" value={money(data.earning.gross)} />
              <Line
                label={`Commission (${data.earning.commission_percent}%)`}
                value={`− ${money(data.earning.commission_amount)}`}
              />
              <div className="flex justify-between border-t border-line pt-2 text-[15px] font-semibold">
                <span>Technician earns</span>
                <span className="num">{money(data.earning.net_payable)}</span>
              </div>
            </div>
            <p className="mt-2.5 text-2xs capitalize text-muted">
              Settlement: {data.earning.settlement_status}
            </p>
          </Card>
        </section>
      )}

      {/* ---------------- timeline ---------------- */}
      <section className="mb-5">
        <SectionHead title="History" />
        <Card className="p-4">
          <ol className="space-y-3.5">
            {data.timeline.map((t, i) => (
              <li key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="mt-1 h-2 w-2 rounded-full bg-indigo" />
                  {i < data.timeline.length - 1 && (
                    <span className="mt-1 w-px flex-1 bg-line" />
                  )}
                </div>
                <div className="flex-1 pb-0.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <StatusChip value={t.status} />
                    <span className="shrink-0 text-2xs text-muted">
                      {timeAgo(t.created_at)}
                    </span>
                  </div>
                  {t.note && <p className="mt-1 text-sm text-ink/75">{t.note}</p>}
                  <p className="text-2xs capitalize text-muted">by {t.actor}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </section>

      {/* ---------------- offers ---------------- */}
      {data.offers.length > 0 && (
        <section className="mb-5">
          <SectionHead title="Dispatch attempts" hint="Who this job was offered to" />
          <Card className="divide-y divide-line">
            {data.offers.map((o) => (
              <div key={o.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="flex-1 truncate text-sm">{o.partner_name}</span>
                {o.distance_km && (
                  <span className="num text-2xs text-muted">{o.distance_km} km</span>
                )}
                <span
                  className={`text-2xs font-semibold capitalize ${
                    o.response === 'accepted'
                      ? 'text-ok'
                      : o.response === 'rejected'
                      ? 'text-danger'
                      : 'text-muted'
                  }`}
                >
                  {o.response || 'waiting'}
                </span>
              </div>
            ))}
          </Card>
        </section>
      )}

      {/* ---------------- cancel ---------------- */}
      {isOpen && (
        <Card className="p-4">
          <p className="font-medium">Cancel this booking</p>
          <p className="mt-0.5 text-sm text-muted">
            If the customer already paid, the amount goes back to their wallet.
          </p>
          <Button variant="danger" size="sm" className="mt-3" onClick={() => setCancelOpen(true)}>
            Cancel booking
          </Button>
        </Card>
      )}

      {/* ---------------- sheets ---------------- */}
      <Sheet open={assignOpen} onClose={() => setAssignOpen(false)} title="Assign a technician">
        {candidates === null ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : candidates.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">
            No approved technician covers this pincode with the right skill. Check the
            technician&apos;s skills and service areas.
          </p>
        ) : (
          <div className="space-y-2">
            <p className="mb-1 text-xs text-muted">
              Sorted by distance, then rating, then current workload.
            </p>
            {candidates.map((c) => (
              <button
                key={c.id}
                onClick={() => assign(c.id)}
                disabled={busy}
                className="press flex w-full items-center gap-3 rounded-xl border border-line p-3 text-left hover:border-indigo disabled:opacity-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-wash font-semibold text-indigo">
                  {(c.name || 'T').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{c.name}</p>
                  <p className="num text-2xs text-muted">
                    {c.distance_km < 9999 ? `${c.distance_km} km · ` : ''}
                    {c.rating_avg.toFixed(1)}★ · {c.jobs_completed} jobs
                    {c.active_jobs > 0 && ` · ${c.active_jobs} active`}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </Sheet>

      <Sheet
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel booking"
        footer={
          <Button variant="danger" full loading={busy} disabled={!cancelReason.trim()} onClick={cancel}>
            Cancel booking
          </Button>
        }
      >
        <Field label="Reason" hint="Kept on the record and visible in the booking history.">
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={3}
            placeholder="Customer called and asked to cancel"
            className="w-full rounded-lg border border-line px-3 py-2.5 text-[15px] focus:border-indigo"
          />
        </Field>
      </Sheet>

      <Sheet
        open={chargeOpen}
        onClose={() => setChargeOpen(false)}
        title="Add a charge"
        footer={
          <Button
            full
            loading={busy}
            disabled={!chargeLabel.trim() || !chargeAmount}
            onClick={addCharge}
          >
            Add charge
          </Button>
        }
      >
        <div className="space-y-4">
          <Field label="What is it for">
            <input
              value={chargeLabel}
              onChange={(e) => setChargeLabel(e.target.value)}
              placeholder="Capacitor replaced"
              className={inputClass}
            />
          </Field>
          <Field
            label="Amount"
            hint="Charges you add here are applied straight away — the customer is not asked to approve."
          >
            <input
              type="number"
              min={1}
              value={chargeAmount}
              onChange={(e) => setChargeAmount(e.target.value)}
              placeholder="450"
              className={inputClass}
            />
          </Field>
        </div>
      </Sheet>

      {toast && <Toast message={toast.msg} tone={toast.tone} onDone={() => setToast(null)} />}
    </div>
  );
}

function Line({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted">{label}</span>
      <span className={`num ${good ? 'text-ok' : ''}`}>{value}</span>
    </div>
  );
}
