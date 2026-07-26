'use client';

import { useCallback, useEffect, useState } from 'react';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { money } from '@/lib/format';
import {
  Button, Card, Empty, ErrorNote, Field, SectionHead, Skeleton, inputClass,
} from '@/components/ui';
import { Chip, FilterChips, PageHead, Sheet, Toast } from '@/components/list';
import { ImageUpload } from '@/components/upload';

type Tab = 'services' | 'categories' | 'slots' | 'areas';

const TABS: Chip[] = [
  { value: 'services', label: 'Services' },
  { value: 'categories', label: 'Categories' },
  { value: 'slots', label: 'Time slots' },
  { value: 'areas', label: 'Service areas' },
];

export default function CataloguePage() {
  const [tab, setTab] = useState<Tab>('services');
  const [toast, setToast] = useState<{ msg: string; tone: 'ok' | 'danger' } | null>(null);

  const say = (msg: string, tone: 'ok' | 'danger' = 'ok') => setToast({ msg, tone });

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 lg:px-8 lg:py-8">
      <PageHead title="Catalogue" />
      <div className="mb-5">
        <FilterChips options={TABS} value={tab} onChange={(v) => setTab(v as Tab)} />
      </div>

      {tab === 'services' && <ServicesTab say={say} />}
      {tab === 'categories' && <CategoriesTab say={say} />}
      {tab === 'slots' && <SlotsTab say={say} />}
      {tab === 'areas' && <AreasTab say={say} />}

      {toast && <Toast message={toast.msg} tone={toast.tone} onDone={() => setToast(null)} />}
    </div>
  );
}

type Say = (msg: string, tone?: 'ok' | 'danger') => void;

/* ================================================================ SERVICES */
const EMPTY_SERVICE = {
  category_id: 0,
  name: '',
  short_desc: '',
  description: '',
  image_url: null as string | null,
  base_price: 0,
  strike_price: null as number | null,
  price_type: 'fixed',
  duration_minutes: 60,
  visit_charge: 0,
  warranty_days: 0,
  warranty_text: '',
  includes: [] as string[],
  excludes: [] as string[],
  display_order: 0,
  is_active: true,
};

function ServicesTab({ say }: { say: Say }) {
  const [cats, setCats] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<number | null>(null);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY_SERVICE);
  const [busy, setBusy] = useState(false);

  const [optionsFor, setOptionsFor] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [c, s] = await Promise.all([
        api<any[]>('/admin/categories'),
        api<any[]>('/admin/services'),
      ]);
      setCats(c);
      setRows(s);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function startNew() {
    setEditing(null);
    setForm({ ...EMPTY_SERVICE, category_id: cats[0]?.id || 0 });
    setOpen(true);
  }

  function startEdit(s: any) {
    setEditing(s);
    setForm({
      ...EMPTY_SERVICE,
      ...s,
      includes: s.includes || [],
      excludes: s.excludes || [],
    });
    setOpen(true);
  }

  async function save() {
    if (!form.name.trim()) return say('Give the service a name', 'danger');
    if (!form.category_id) return say('Pick a category', 'danger');

    setBusy(true);
    try {
      const body = {
        ...form,
        base_price: Number(form.base_price) || 0,
        strike_price: form.strike_price ? Number(form.strike_price) : null,
        visit_charge: Number(form.visit_charge) || 0,
        duration_minutes: Number(form.duration_minutes) || 60,
        warranty_days: Number(form.warranty_days) || 0,
        display_order: Number(form.display_order) || 0,
      };
      if (editing) {
        await api(`/admin/services/${editing.id}`, { method: 'PUT', body });
        say('Service updated');
      } else {
        await api('/admin/services', { method: 'POST', body });
        say('Service created');
      }
      setOpen(false);
      await load();
    } catch (e: any) {
      say(e.message, 'danger');
    } finally {
      setBusy(false);
    }
  }

  async function remove(s: any) {
    if (!confirm(`Delete "${s.name}"?`)) return;
    try {
      await api(`/admin/services/${s.id}`, { method: 'DELETE' });
      say('Service removed');
      await load();
    } catch (e: any) {
      say(e.message, 'danger');
    }
  }

  const visible = filter ? rows.filter((r) => r.category_id === filter) : rows;

  if (loading) {
    return (
      <div className="space-y-2.5">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
      </div>
    );
  }
  if (error) return <ErrorNote message={error} retry={load} />;

  return (
    <>
      <SectionHead
        title={`${rows.length} services`}
        hint="What customers can book. Prices here are what they pay."
        action={<Button size="sm" onClick={startNew}><Plus className="h-4 w-4" />New</Button>}
      />

      {cats.length > 1 && (
        <div className="mb-3">
          <FilterChips
            options={[
              { value: '', label: 'All' },
              ...cats.map((c) => ({ value: String(c.id), label: c.name })),
            ]}
            value={filter ? String(filter) : ''}
            onChange={(v) => setFilter(v ? Number(v) : null)}
          />
        </div>
      )}

      {visible.length === 0 ? (
        <Card>
          <Empty
            title="No services yet"
            hint="Add your first service so customers have something to book."
            action={<Button onClick={startNew}>Add a service</Button>}
          />
        </Card>
      ) : (
        <div className="space-y-2.5">
          {visible.map((s) => (
            <Card key={s.id} className="p-3.5">
              <div className="flex items-start gap-3">
                {s.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.image_url} alt="" className="h-14 w-14 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-paper text-2xs text-muted">
                    No image
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{s.name}</p>
                    {!s.is_active && (
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-2xs text-muted">
                        Hidden
                      </span>
                    )}
                  </div>
                  <p className="text-2xs text-muted">{s.category_name}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-2xs text-muted">
                    <span className="num font-medium text-ink">
                      {s.price_type === 'inspection_based'
                        ? 'On inspection'
                        : `${s.price_type === 'starting_from' ? 'From ' : ''}${money(s.base_price)}`}
                    </span>
                    {Number(s.visit_charge) > 0 && (
                      <span className="num">+{money(s.visit_charge)} visit</span>
                    )}
                    <span className="num">{s.duration_minutes} min</span>
                    {s.warranty_days > 0 && (
                      <span className="num">{s.warranty_days}d warranty</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex gap-2 border-t border-line pt-2.5">
                <button
                  onClick={() => startEdit(s)}
                  className="press text-sm font-medium text-indigo"
                >
                  Edit
                </button>
                <button
                  onClick={() => setOptionsFor(s)}
                  className="press text-sm font-medium text-indigo"
                >
                  Options
                </button>
                <button
                  onClick={() => remove(s)}
                  className="press ml-auto text-sm font-medium text-danger"
                >
                  Delete
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ---------------- service form ---------------- */}
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit service' : 'New service'}
        footer={<Button full loading={busy} onClick={save}>Save service</Button>}
      >
        <div className="space-y-4">
          <Field label="Name">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="AC Gas Refilling"
              className={inputClass}
            />
          </Field>

          <Field label="Category">
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: Number(e.target.value) })}
              className={inputClass}
            >
              <option value={0}>Choose one</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>

          <ImageUpload
            value={form.image_url}
            onChange={(url) => setForm({ ...form, image_url: url })}
            folder="services"
          />

          <Field
            label="Pricing"
            hint="Fixed shows one price. Starting from shows 'From ₹X'. On inspection hides the price and charges only the visit fee up front."
          >
            <select
              value={form.price_type}
              onChange={(e) => setForm({ ...form, price_type: e.target.value })}
              className={inputClass}
            >
              <option value="fixed">Fixed price</option>
              <option value="starting_from">Starting from</option>
              <option value="inspection_based">Price on inspection</option>
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Price">
              <input
                type="number"
                value={form.base_price}
                onChange={(e) => setForm({ ...form, base_price: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Struck-out price" hint="Optional">
              <input
                type="number"
                value={form.strike_price ?? ''}
                onChange={(e) =>
                  setForm({ ...form, strike_price: e.target.value || null })
                }
                className={inputClass}
              />
            </Field>
            <Field label="Visit charge">
              <input
                type="number"
                value={form.visit_charge}
                onChange={(e) => setForm({ ...form, visit_charge: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Duration (min)">
              <input
                type="number"
                value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Warranty (days)">
              <input
                type="number"
                value={form.warranty_days}
                onChange={(e) => setForm({ ...form, warranty_days: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Sort order">
              <input
                type="number"
                value={form.display_order}
                onChange={(e) => setForm({ ...form, display_order: e.target.value })}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Short description" hint="One line, shown in the service list.">
            <input
              value={form.short_desc || ''}
              onChange={(e) => setForm({ ...form, short_desc: e.target.value })}
              placeholder="Complete gas top-up with leak check"
              className={inputClass}
            />
          </Field>

          <Field label="Full description">
            <textarea
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-line px-3 py-2.5 text-[15px] focus:border-indigo"
            />
          </Field>

          <ListField
            label="What's included"
            hint="One per line. Customers read this before booking."
            value={form.includes}
            onChange={(v) => setForm({ ...form, includes: v })}
          />
          <ListField
            label="What's not included"
            value={form.excludes}
            onChange={(v) => setForm({ ...form, excludes: v })}
          />

          <Field label="Warranty note">
            <input
              value={form.warranty_text || ''}
              onChange={(e) => setForm({ ...form, warranty_text: e.target.value })}
              placeholder="30-day warranty on the repair"
              className={inputClass}
            />
          </Field>

          <Toggle
            label="Visible to customers"
            checked={form.is_active}
            onChange={(v) => setForm({ ...form, is_active: v })}
          />
        </div>
      </Sheet>

      {optionsFor && (
        <OptionsSheet
          service={optionsFor}
          onClose={() => setOptionsFor(null)}
          say={say}
        />
      )}
    </>
  );
}

/* ---------------------------------------------------------------- options */
function OptionsSheet({
  service, onClose, say,
}: { service: any; onClose: () => void; say: Say }) {
  const [rows, setRows] = useState<any[] | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setRows(await api<any[]>(`/admin/services/${service.id}/options`));
    } catch (e: any) {
      say(e.message, 'danger');
      setRows([]);
    }
  }, [service.id, say]);

  useEffect(() => { load(); }, [load]);

  async function add() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await api(`/admin/services/${service.id}/options`, {
        method: 'POST',
        body: { name: name.trim(), extra_price: Number(price) || 0 },
      });
      setName('');
      setPrice('');
      await load();
    } catch (e: any) {
      say(e.message, 'danger');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    try {
      await api(`/admin/options/${id}`, { method: 'DELETE' });
      await load();
    } catch (e: any) {
      say(e.message, 'danger');
    }
  }

  return (
    <Sheet open onClose={onClose} title={`Options · ${service.name}`}>
      <p className="mb-4 text-sm text-muted">
        Variants the customer picks at checkout, like tonnage or load type. The extra
        amount is added to the service price.
      </p>

      {rows === null ? (
        <Skeleton className="h-24 w-full" />
      ) : rows.length === 0 ? (
        <p className="py-4 text-sm text-muted">No options yet.</p>
      ) : (
        <div className="mb-4 divide-y divide-line rounded-lg border border-line">
          {rows.map((o) => (
            <div key={o.id} className="flex items-center gap-3 px-3 py-2.5">
              <GripVertical className="h-4 w-4 text-muted" />
              <span className="flex-1 text-sm">{o.name}</span>
              <span className="num text-sm">
                {Number(o.extra_price) > 0 ? `+${money(o.extra_price)}` : 'No extra'}
              </span>
              <button
                onClick={() => remove(o.id)}
                aria-label="Remove option"
                className="p-1 text-danger"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="1.5 Ton"
          className={`${inputClass} flex-1`}
        />
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="+₹"
          className={`${inputClass} w-24`}
        />
        <Button onClick={add} loading={busy}>Add</Button>
      </div>
    </Sheet>
  );
}

/* ================================================================ CATEGORIES */
function CategoriesTab({ say }: { say: Say }) {
  const [rows, setRows] = useState<any[] | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({
    name: '', icon_url: null, display_order: 0, is_active: true,
  });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setRows(await api<any[]>('/admin/categories'));
    } catch (e: any) {
      say(e.message, 'danger');
      setRows([]);
    }
  }, [say]);

  useEffect(() => { load(); }, [load]);

  async function save() {
    if (!form.name.trim()) return say('Give the category a name', 'danger');
    setBusy(true);
    try {
      const body = { ...form, display_order: Number(form.display_order) || 0 };
      if (editing) await api(`/admin/categories/${editing.id}`, { method: 'PUT', body });
      else await api('/admin/categories', { method: 'POST', body });
      say(editing ? 'Category updated' : 'Category created');
      setOpen(false);
      await load();
    } catch (e: any) {
      say(e.message, 'danger');
    } finally {
      setBusy(false);
    }
  }

  async function remove(c: any) {
    if (!confirm(`Delete "${c.name}"?`)) return;
    try {
      await api(`/admin/categories/${c.id}`, { method: 'DELETE' });
      say('Category removed');
      await load();
    } catch (e: any) {
      say(e.message, 'danger');
    }
  }

  return (
    <>
      <SectionHead
        title="Categories"
        hint="The top-level grid on the customer home screen."
        action={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setForm({ name: '', icon_url: null, display_order: 0, is_active: true });
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />New
          </Button>
        }
      />

      {rows === null ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <Card className="divide-y divide-line">
          {rows.map((c) => (
            <div key={c.id} className="flex items-center gap-3 px-4 py-3">
              {c.icon_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.icon_url} alt="" className="h-9 w-9 rounded-lg object-cover" />
              ) : (
                <div className="h-9 w-9 rounded-lg bg-paper" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{c.name}</p>
                <p className="num text-2xs text-muted">
                  {c.service_count ?? 0} services
                  {!c.is_active && ' · hidden'}
                </p>
              </div>
              <button
                onClick={() => { setEditing(c); setForm(c); setOpen(true); }}
                className="press text-sm font-medium text-indigo"
              >
                Edit
              </button>
              <button
                onClick={() => remove(c)}
                aria-label="Delete category"
                className="p-1 text-danger"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </Card>
      )}

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit category' : 'New category'}
        footer={<Button full loading={busy} onClick={save}>Save</Button>}
      >
        <div className="space-y-4">
          <Field label="Name">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Air Conditioner"
              className={inputClass}
            />
          </Field>
          <ImageUpload
            label="Icon"
            value={form.icon_url}
            onChange={(url) => setForm({ ...form, icon_url: url })}
            folder="services"
          />
          <Field label="Sort order">
            <input
              type="number"
              value={form.display_order}
              onChange={(e) => setForm({ ...form, display_order: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Toggle
            label="Visible to customers"
            checked={form.is_active}
            onChange={(v) => setForm({ ...form, is_active: v })}
          />
        </div>
      </Sheet>
    </>
  );
}

/* ================================================================ SLOTS */
function SlotsTab({ say }: { say: Say }) {
  const [rows, setRows] = useState<any[] | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({
    label: '', start_time: '09:00', end_time: '11:00',
    max_bookings: 20, display_order: 0, is_active: true,
  });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setRows(await api<any[]>('/admin/slots'));
    } catch (e: any) {
      say(e.message, 'danger');
      setRows([]);
    }
  }, [say]);

  useEffect(() => { load(); }, [load]);

  async function save() {
    setBusy(true);
    try {
      const body = {
        ...form,
        max_bookings: Number(form.max_bookings) || 1,
        display_order: Number(form.display_order) || 0,
      };
      if (editing) await api(`/admin/slots/${editing.id}`, { method: 'PUT', body });
      else await api('/admin/slots', { method: 'POST', body });
      say(editing ? 'Slot updated' : 'Slot created');
      setOpen(false);
      await load();
    } catch (e: any) {
      say(e.message, 'danger');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <SectionHead
        title="Time slots"
        hint="Capacity is how many bookings you can serve in that window across all technicians."
        action={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setForm({
                label: '', start_time: '09:00', end_time: '11:00',
                max_bookings: 20, display_order: 0, is_active: true,
              });
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />New
          </Button>
        }
      />

      {rows === null ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <Card className="divide-y divide-line">
          {rows.map((s) => (
            <div key={s.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="num font-medium">{s.label}</p>
                <p className="num text-2xs text-muted">
                  Up to {s.max_bookings} bookings{!s.is_active && ' · off'}
                </p>
              </div>
              <button
                onClick={() => {
                  setEditing(s);
                  setForm({
                    ...s,
                    start_time: String(s.start_time).slice(0, 5),
                    end_time: String(s.end_time).slice(0, 5),
                  });
                  setOpen(true);
                }}
                className="press text-sm font-medium text-indigo"
              >
                Edit
              </button>
            </div>
          ))}
        </Card>
      )}

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit slot' : 'New slot'}
        footer={<Button full loading={busy} onClick={save}>Save</Button>}
      >
        <div className="space-y-4">
          <Field label="Label" hint="Exactly what the customer sees.">
            <input
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="09:00 AM - 11:00 AM"
              className={inputClass}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Starts">
              <input
                type="time"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Ends">
              <input
                type="time"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="Capacity" hint="Bookings allowed in this window per day.">
            <input
              type="number"
              value={form.max_bookings}
              onChange={(e) => setForm({ ...form, max_bookings: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Toggle
            label="Offered to customers"
            checked={form.is_active}
            onChange={(v) => setForm({ ...form, is_active: v })}
          />
        </div>
      </Sheet>
    </>
  );
}

/* ================================================================ AREAS */
function AreasTab({ say }: { say: Say }) {
  const [rows, setRows] = useState<any[] | null>(null);
  const [open, setOpen] = useState(false);
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pins, setPins] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setRows(await api<any[]>('/service-areas'));
    } catch (e: any) {
      say(e.message, 'danger');
      setRows([]);
    }
  }, [say]);

  useEffect(() => { load(); }, [load]);

  async function addBulk() {
    const list = pins.split(/[\s,]+/).map((p) => p.trim()).filter(Boolean);
    if (!list.length) return say('Add at least one pincode', 'danger');
    if (!city.trim()) return say('Add the city name', 'danger');

    setBusy(true);
    try {
      const res = await api<{ added: number }>('/admin/service-areas/bulk', {
        method: 'POST',
        query: { city: city.trim(), state: state.trim() || city.trim() },
        body: list,
      });
      say(`${res.added} pincodes added`);
      setPins('');
      setOpen(false);
      await load();
    } catch (e: any) {
      say(e.message, 'danger');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    try {
      await api(`/admin/service-areas/${id}`, { method: 'DELETE' });
      await load();
    } catch (e: any) {
      say(e.message, 'danger');
    }
  }

  const byCity = (rows || []).reduce((acc: Record<string, any[]>, r) => {
    (acc[r.city] ||= []).push(r);
    return acc;
  }, {});

  return (
    <>
      <SectionHead
        title="Service areas"
        hint="Customers outside these pincodes cannot book at all."
        action={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />Add
          </Button>
        }
      />

      {rows === null ? (
        <Skeleton className="h-40 w-full" />
      ) : rows.length === 0 ? (
        <Card>
          <Empty
            title="No areas yet"
            hint="Nobody can place a booking until you add at least one pincode."
            action={<Button onClick={() => setOpen(true)}>Add pincodes</Button>}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {Object.entries(byCity).map(([cityName, list]) => (
            <Card key={cityName} className="p-4">
              <p className="font-medium">{cityName}</p>
              <p className="num text-2xs text-muted">{list.length} pincodes</p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {list.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => remove(a.id)}
                    title="Remove"
                    className="num press rounded-md bg-paper px-2 py-1 text-2xs hover:bg-red-50 hover:text-danger"
                  >
                    {a.pincode}
                  </button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Add pincodes"
        footer={<Button full loading={busy} onClick={addBulk}>Add pincodes</Button>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="City">
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ludhiana"
                className={inputClass}
              />
            </Field>
            <Field label="State">
              <input
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Punjab"
                className={inputClass}
              />
            </Field>
          </div>
          <Field
            label="Pincodes"
            hint="Separate with commas, spaces or new lines. Existing ones are re-enabled."
          >
            <textarea
              value={pins}
              onChange={(e) => setPins(e.target.value)}
              rows={5}
              placeholder="141001, 141002, 141003"
              className="num w-full rounded-lg border border-line px-3 py-2.5 text-[15px] focus:border-indigo"
            />
          </Field>
        </div>
      </Sheet>
    </>
  );
}

/* ================================================================ bits */
function Toggle({
  label, checked, onChange,
}: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-lg border border-line px-3.5 py-3 text-left"
    >
      <span className="text-[15px]">{label}</span>
      <span
        className={`relative h-6 w-10 rounded-full transition ${
          checked ? 'bg-ok' : 'bg-line'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            checked ? 'left-[1.125rem]' : 'left-0.5'
          }`}
        />
      </span>
    </button>
  );
}

function ListField({
  label, hint, value, onChange,
}: { label: string; hint?: string; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <Field label={label} hint={hint}>
      <textarea
        value={value.join('\n')}
        onChange={(e) =>
          onChange(e.target.value.split('\n').map((l) => l.trim()).filter(Boolean))
        }
        rows={3}
        placeholder={'Gas leak check\nFilter cleaning'}
        className="w-full rounded-lg border border-line px-3 py-2.5 text-[15px] focus:border-indigo"
      />
    </Field>
  );
}
