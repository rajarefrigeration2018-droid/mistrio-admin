'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Check, FileText, Phone, X } from 'lucide-react';
import { api } from '@/lib/api';
import { dateFull, money, phone as fmtPhone, timeAgo } from '@/lib/format';
import {
  Button, Card, ErrorNote, Field, Rail, SectionHead, Skeleton, StatusChip, inputClass,
} from '@/components/ui';
import { Sheet, Toast } from '@/components/list';

type Detail = {
  partner: any;
  documents: { id: number; doc_type: string; file_url: string; verified: boolean }[];
  skills: { id: number; name: string }[];
  recent_jobs: any[];
  earnings: {
    total: number; settled: number; pending: number; cash_collected: number; jobs: number;
  };
  reviews: { rating: number; comment: string; created_at: string; user_name: string }[];
};

export default function TechnicianDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ msg: string; tone: 'ok' | 'danger' } | null>(null);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [commissionOpen, setCommissionOpen] = useState(false);
  const [commission, setCommission] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await api<Detail>(`/admin/partners/${id}`);
      setData(res);
      setCommission(
        res.partner.commission_percent_override
          ? String(res.partner.commission_percent_override)
          : ''
      );
    } catch (e: any) {
      setError(e.message);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function decide(approve: boolean, reason?: string) {
    setBusy(true);
    try {
      await api(`/admin/partners/${id}/approval`, {
        method: 'POST',
        body: { approve, reason },
      });
      setToast({ msg: approve ? 'Technician approved' : 'Technician rejected', tone: 'ok' });
      setRejectOpen(false);
      await load();
    } catch (e: any) {
      setToast({ msg: e.message, tone: 'danger' });
    } finally {
      setBusy(false);
    }
  }

  async function saveCommission() {
    setBusy(true);
    try {
      await api(`/admin/partners/${id}`, {
        method: 'PUT',
        body: {
          commission_percent_override: commission === '' ? null : Number(commission),
        },
      });
      setToast({ msg: 'Commission updated', tone: 'ok' });
      setCommissionOpen(false);
      await load();
    } catch (e: any) {
      setToast({ msg: e.message, tone: 'danger' });
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(status: string, label: string) {
    setBusy(true);
    try {
      await api(`/admin/partners/${id}`, { method: 'PUT', body: { status } });
      setToast({ msg: label, tone: 'ok' });
      await load();
    } catch (e: any) {
      setToast({ msg: e.message, tone: 'danger' });
    } finally {
      setBusy(false);
    }
  }

  async function verifyDoc(docId: number) {
    try {
      await api(`/admin/partners/${id}/documents/${docId}/verify`, { method: 'POST' });
      setToast({ msg: 'Document verified', tone: 'ok' });
      await load();
    } catch (e: any) {
      setToast({ msg: e.message, tone: 'danger' });
    }
  }

  if (error && !data) {
    return <div className="p-4 lg:p-8"><ErrorNote message={error} retry={load} /></div>;
  }
  if (!data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-5 lg:px-8">
        <Skeleton className="mb-4 h-6 w-24" />
        <Skeleton className="mb-3 h-28 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const p = data.partner;
  const isPending = p.status === 'pending';

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 lg:px-8 lg:py-8">
      <button
        onClick={() => router.push('/technicians')}
        className="press mb-4 inline-flex items-center gap-1.5 text-sm text-muted"
      >
        <ArrowLeft className="h-4 w-4" />
        All technicians
      </button>

      {/* ---------------- identity ---------------- */}
      <Card className="mb-4 p-4">
        <div className="flex items-start gap-3.5">
          {p.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.photo} alt="" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-wash text-xl font-semibold text-indigo">
              {(p.name || '?').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">
                {p.name || 'Registration incomplete'}
              </h1>
              <StatusChip value={p.status} />
              {p.is_online && (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-2xs font-semibold text-ok">
                  Online
                </span>
              )}
            </div>
            <a
              href={`tel:${p.phone}`}
              className="num mt-1 inline-flex items-center gap-1.5 text-sm text-indigo"
            >
              <Phone className="h-3.5 w-3.5" />
              {fmtPhone(p.phone)}
            </a>
            <p className="mt-1 text-xs text-muted">
              Registered {timeAgo(p.created_at)}
              {p.approved_at && ` · Approved ${dateFull(p.approved_at)}`}
            </p>
          </div>
        </div>

        {p.reject_reason && (
          <div className="mt-3.5 rounded-lg bg-red-50 px-3 py-2.5">
            <p className="text-2xs font-semibold uppercase tracking-wide text-danger">
              Rejection reason
            </p>
            <p className="mt-0.5 text-sm text-danger">{p.reject_reason}</p>
          </div>
        )}
      </Card>

      {/* ---------------- approval ---------------- */}
      {isPending && (
        <Card className="mb-4 border-amber/40 bg-amber-wash p-4">
          <p className="font-medium">This technician is waiting for approval</p>
          <p className="mt-0.5 text-sm text-ink/70">
            Check the documents below before approving. Once approved they can go
            online and start receiving jobs.
          </p>
          <div className="mt-3.5 flex gap-2.5">
            <Button onClick={() => decide(true)} loading={busy} full>
              <Check className="h-4 w-4" />
              Approve
            </Button>
            <Button variant="outline" onClick={() => setRejectOpen(true)} full>
              <X className="h-4 w-4" />
              Reject
            </Button>
          </div>
        </Card>
      )}

      {/* ---------------- documents ---------------- */}
      <section className="mb-5">
        <SectionHead title="Documents" hint={`${data.documents.length} uploaded`} />
        <Card className="divide-y divide-line">
          {data.documents.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted">
              No documents uploaded yet.
            </p>
          ) : (
            data.documents.map((d) => (
              <div key={d.id} className="flex items-center gap-3 px-4 py-3">
                <FileText className="h-4 w-4 shrink-0 text-muted" />
                <a
                  href={d.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 truncate text-sm capitalize text-indigo underline"
                >
                  {d.doc_type.replace(/_/g, ' ')}
                </a>
                {d.verified ? (
                  <span className="text-2xs font-semibold text-ok">Verified</span>
                ) : (
                  <button
                    onClick={() => verifyDoc(d.id)}
                    className="press rounded-md border border-line px-2.5 py-1 text-2xs font-semibold"
                  >
                    Verify
                  </button>
                )}
              </div>
            ))
          )}
        </Card>
      </section>

      {/* ---------------- coverage ---------------- */}
      <section className="mb-5">
        <SectionHead title="Coverage" />
        <Card className="p-4">
          <p className="eyebrow">Skills</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {data.skills.length === 0 ? (
              <span className="text-sm text-muted">None selected</span>
            ) : (
              data.skills.map((s) => (
                <span
                  key={s.id}
                  className="rounded-md bg-indigo-wash px-2 py-1 text-2xs font-medium text-indigo"
                >
                  {s.name}
                </span>
              ))
            )}
          </div>

          <p className="eyebrow mt-4">Service pincodes</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {(p.service_area_pincodes || []).length === 0 ? (
              <span className="text-sm text-muted">None — this technician gets no jobs</span>
            ) : (
              p.service_area_pincodes.map((pin: string) => (
                <span key={pin} className="num rounded-md bg-paper px-2 py-1 text-2xs">
                  {pin}
                </span>
              ))
            )}
          </div>
        </Card>
      </section>

      {/* ---------------- money ---------------- */}
      <section className="mb-5">
        <SectionHead
          title="Earnings"
          action={
            <button
              onClick={() => setCommissionOpen(true)}
              className="press text-sm font-medium text-indigo"
            >
              Commission
            </button>
          }
        />
        <Card className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <Stat label="Total earned" value={money(data.earnings.total)} />
            <Stat label="Not yet paid" value={money(data.earnings.pending)} accent />
            <Stat label="Already settled" value={money(data.earnings.settled)} />
            <Stat label="Cash collected" value={money(data.earnings.cash_collected)} />
          </div>
          <p className="mt-3.5 border-t border-line pt-3 text-xs text-muted">
            Commission{' '}
            <span className="num font-medium text-ink">
              {p.commission_percent_override ?? 'default'}
              {p.commission_percent_override ? '%' : ''}
            </span>
            {' · '}
            <span className="num">{data.earnings.jobs}</span> jobs settled
          </p>
        </Card>
      </section>

      {/* ---------------- jobs ---------------- */}
      <section className="mb-5">
        <SectionHead title="Recent jobs" />
        <Card className="divide-y divide-line">
          {data.recent_jobs.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted">No jobs yet.</p>
          ) : (
            data.recent_jobs.map((j) => (
              <Link
                key={j.id}
                href={`/bookings/${j.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-paper"
              >
                <div className="min-w-0 flex-1">
                  <p className="num text-sm">{j.booking_code}</p>
                  <p className="text-2xs text-muted">{dateFull(j.scheduled_date)}</p>
                </div>
                <StatusChip value={j.status} />
                <span className="num w-16 text-right text-sm font-medium">
                  {money(j.net_payable ?? j.total, true)}
                </span>
              </Link>
            ))
          )}
        </Card>
      </section>

      {/* ---------------- reviews ---------------- */}
      {data.reviews.length > 0 && (
        <section className="mb-5">
          <SectionHead title="Customer reviews" />
          <Card className="divide-y divide-line">
            {data.reviews.map((r, i) => (
              <div key={i} className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="num text-sm font-semibold">{r.rating}★</span>
                  <span className="text-sm">{r.user_name}</span>
                  <span className="ml-auto text-2xs text-muted">{timeAgo(r.created_at)}</span>
                </div>
                {r.comment && <p className="mt-1 text-sm text-ink/75">{r.comment}</p>}
              </div>
            ))}
          </Card>
        </section>
      )}

      {/* ---------------- danger zone ---------------- */}
      {p.status === 'approved' && (
        <Card className="p-4">
          <p className="font-medium">Suspend this technician</p>
          <p className="mt-0.5 text-sm text-muted">
            They are taken offline immediately and stop receiving jobs. Jobs already
            assigned stay with them.
          </p>
          <Button
            variant="danger"
            size="sm"
            className="mt-3"
            loading={busy}
            onClick={() => setStatus('suspended', 'Technician suspended')}
          >
            Suspend
          </Button>
        </Card>
      )}

      {p.status === 'suspended' && (
        <Card className="p-4">
          <p className="font-medium">This technician is suspended</p>
          <Button
            size="sm"
            className="mt-3"
            loading={busy}
            onClick={() => setStatus('approved', 'Technician reinstated')}
          >
            Reinstate
          </Button>
        </Card>
      )}

      {/* ---------------- sheets ---------------- */}
      <Sheet
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Reject registration"
        footer={
          <Button
            variant="danger"
            full
            loading={busy}
            disabled={!rejectReason.trim()}
            onClick={() => decide(false, rejectReason.trim())}
          >
            Reject
          </Button>
        }
      >
        <Field
          label="Reason"
          hint="The technician sees this in the app, so be specific about what to fix."
        >
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
            placeholder="Aadhaar photo is blurred. Please upload a clear picture of both sides."
            className="w-full rounded-lg border border-line px-3 py-2.5 text-[15px] focus:border-indigo"
          />
        </Field>
      </Sheet>

      <Sheet
        open={commissionOpen}
        onClose={() => setCommissionOpen(false)}
        title="Commission rate"
        footer={
          <Button full loading={busy} onClick={saveCommission}>
            Save
          </Button>
        }
      >
        <Field
          label="Override percent"
          hint="Leave empty to use the default rate from Settings. Changes apply to new jobs only — past earnings keep the rate they were created with."
        >
          <input
            type="number"
            min={0}
            max={100}
            value={commission}
            onChange={(e) => setCommission(e.target.value)}
            placeholder="Default"
            className={inputClass}
          />
        </Field>
      </Sheet>

      {toast && (
        <Toast message={toast.msg} tone={toast.tone} onDone={() => setToast(null)} />
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <p className={`num mt-0.5 text-lg font-semibold ${accent ? 'text-amber-deep' : ''}`}>
        {value}
      </p>
    </div>
  );
}
