'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  Button, Card, ErrorNote, SectionHead, Skeleton, inputClass,
} from '@/components/ui';
import { PageHead, Toast } from '@/components/list';

type ConfigRow = {
  key: string;
  value: any;
  group_name: string;
  data_type: string;
  label: string | null;
  description: string | null;
  is_public: boolean;
};

/* The order an owner actually needs them, not alphabetical. */
const GROUP_ORDER = [
  'branding', 'support', 'money', 'rules', 'payment',
  'parts', 'features', 'legal', 'theme', 'system', 'general',
];

const GROUP_TITLES: Record<string, { title: string; hint: string }> = {
  branding: { title: 'Brand', hint: 'Name and details printed on invoices' },
  support: { title: 'Support contacts', hint: 'Shown to customers inside the app' },
  money: { title: 'Money', hint: 'Tax, commission and payout limits' },
  rules: { title: 'Operating rules', hint: 'How dispatch and cancellations behave' },
  payment: { title: 'Payment methods', hint: 'Turn methods on or off everywhere at once' },
  parts: { title: 'Spare parts shop', hint: 'Delivery, returns and order limits' },
  features: { title: 'Features', hint: 'Switch whole modules on or off' },
  legal: { title: 'Legal pages', hint: 'Links opened from the app' },
  theme: { title: 'Appearance', hint: 'Colours used by the customer app' },
  system: { title: 'System', hint: 'Version control and maintenance mode' },
  general: { title: 'Other', hint: '' },
};

export default function SettingsPage() {
  const { admin } = useAuth();
  const [rows, setRows] = useState<ConfigRow[] | null>(null);
  const [error, setError] = useState('');
  const [drafts, setDrafts] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; tone: 'ok' | 'danger' } | null>(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await api<{ flat: ConfigRow[] }>('/admin/config');
      setRows(res.flat);
      setDrafts({});
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save(key: string) {
    setSaving(key);
    try {
      await api(`/admin/config/${key}`, { method: 'PUT', body: { value: drafts[key] } });
      setRows((prev) =>
        prev ? prev.map((r) => (r.key === key ? { ...r, value: drafts[key] } : r)) : prev
      );
      setDrafts((d) => {
        const next = { ...d };
        delete next[key];
        return next;
      });
      setToast({ msg: 'Saved', tone: 'ok' });
    } catch (e: any) {
      setToast({ msg: e.message, tone: 'danger' });
    } finally {
      setSaving(null);
    }
  }

  const grouped = useMemo(() => {
    const map: Record<string, ConfigRow[]> = {};
    (rows || []).forEach((r) => (map[r.group_name] ||= []).push(r));
    return map;
  }, [rows]);

  const maintenance = rows?.find((r) => r.key === 'maintenance_mode');
  const dirtyCount = Object.keys(drafts).length;

  if (error && !rows) {
    return <div className="p-4 lg:p-8"><ErrorNote message={error} retry={load} /></div>;
  }

  if (!rows) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-5 lg:px-8">
        <Skeleton className="mb-5 h-8 w-32" />
        <Skeleton className="mb-3 h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 lg:px-8 lg:py-8">
      <PageHead title="Settings" />

      <p className="mb-5 text-sm text-muted">
        Everything here is read live by the customer app, the partner app and this
        console. Changes take effect on the next app launch — no update needed.
      </p>

      {maintenance?.value === true && (
        <Card className="mb-5 border-danger/30 bg-red-50 p-4">
          <div className="flex gap-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
            <div>
              <p className="font-medium text-danger">Maintenance mode is on</p>
              <p className="mt-0.5 text-sm text-danger/80">
                Customers cannot book anything right now. Turn it off under System
                when you are done.
              </p>
            </div>
          </div>
        </Card>
      )}

      {dirtyCount > 0 && (
        <div className="mb-5 rounded-xl border border-amber/40 bg-amber-wash px-4 py-3">
          <p className="text-sm">
            <span className="num font-semibold">{dirtyCount}</span> unsaved{' '}
            {dirtyCount === 1 ? 'change' : 'changes'}. Save each one with the tick
            beside it.
          </p>
        </div>
      )}

      <div className="space-y-6">
        {GROUP_ORDER.filter((g) => grouped[g]?.length).map((group) => {
          const meta = GROUP_TITLES[group] || { title: group, hint: '' };
          return (
            <section key={group}>
              <SectionHead title={meta.title} hint={meta.hint} />
              <Card className="divide-y divide-line">
                {grouped[group].map((row) => (
                  <ConfigField
                    key={row.key}
                    row={row}
                    draft={drafts[row.key]}
                    dirty={row.key in drafts}
                    saving={saving === row.key}
                    onChange={(v) => setDrafts((d) => ({ ...d, [row.key]: v }))}
                    onSave={() => save(row.key)}
                    onReset={() =>
                      setDrafts((d) => {
                        const next = { ...d };
                        delete next[row.key];
                        return next;
                      })
                    }
                  />
                ))}
              </Card>
            </section>
          );
        })}
      </div>

      {admin?.role === 'super_admin' && (
        <Card className="mt-6 p-4">
          <p className="font-medium">Change your password</p>
          <p className="mt-0.5 text-sm text-muted">
            If you are still using the password that came with the install, change it now.
          </p>
          <PasswordChange onDone={(m, t) => setToast({ msg: m, tone: t })} />
        </Card>
      )}

      {toast && <Toast message={toast.msg} tone={toast.tone} onDone={() => setToast(null)} />}
    </div>
  );
}

/* ---------------------------------------------------------------- field */
function ConfigField({
  row, draft, dirty, saving, onChange, onSave, onReset,
}: {
  row: ConfigRow;
  draft: any;
  dirty: boolean;
  saving: boolean;
  onChange: (v: any) => void;
  onSave: () => void;
  onReset: () => void;
}) {
  const current = dirty ? draft : row.value;
  const label = row.label || row.key.replace(/_/g, ' ');

  /* booleans are a switch, not a field with a save button */
  if (row.data_type === 'bool') {
    const on = Boolean(current);
    return (
      <div className="flex items-start gap-3 px-4 py-3.5">
        <div className="min-w-0 flex-1">
          <p className="text-[15px] capitalize">{label}</p>
          {row.description && (
            <p className="mt-0.5 text-xs text-muted">{row.description}</p>
          )}
        </div>
        <button
          disabled={saving}
          onClick={() => { onChange(!on); setTimeout(onSave, 0); }}
          aria-label={label}
          className={`relative mt-0.5 h-6 w-10 shrink-0 rounded-full transition ${
            on ? 'bg-ok' : 'bg-line'
          } ${saving ? 'opacity-50' : ''}`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
              on ? 'left-[1.125rem]' : 'left-0.5'
            }`}
          />
        </button>
      </div>
    );
  }

  const isNumber = row.data_type === 'number';
  const isColor = row.data_type === 'color';

  return (
    <div className="px-4 py-3.5">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[15px] capitalize">{label}</p>
        <code className="num shrink-0 text-2xs text-muted">{row.key}</code>
      </div>
      {row.description && <p className="mt-0.5 text-xs text-muted">{row.description}</p>}

      <div className="mt-2 flex gap-2">
        {isColor ? (
          <>
            <input
              type="color"
              value={String(current || '#000000')}
              onChange={(e) => onChange(e.target.value)}
              className="h-11 w-14 shrink-0 rounded-lg border border-line"
            />
            <input
              value={String(current ?? '')}
              onChange={(e) => onChange(e.target.value)}
              className={`${inputClass} num flex-1`}
            />
          </>
        ) : (
          <input
            type={isNumber ? 'number' : 'text'}
            value={current === null || current === undefined ? '' : String(current)}
            onChange={(e) =>
              onChange(isNumber ? Number(e.target.value) : e.target.value)
            }
            className={`${inputClass} ${isNumber ? 'num' : ''} flex-1`}
          />
        )}

        {dirty && (
          <>
            <button
              onClick={onSave}
              disabled={saving}
              aria-label="Save"
              className="press flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-indigo text-white disabled:opacity-50"
            >
              {saving ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={onReset}
              className="press h-11 shrink-0 rounded-lg border border-line px-3 text-sm"
            >
              Undo
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- password */
function PasswordChange({
  onDone,
}: { onDone: (msg: string, tone: 'ok' | 'danger') => void }) {
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (newPw.length < 8) return onDone('Use at least 8 characters', 'danger');
    setBusy(true);
    try {
      await api('/auth/admin/change-password', {
        method: 'POST',
        body: { old_password: oldPw, new_password: newPw },
      });
      setOldPw('');
      setNewPw('');
      onDone('Password changed. Sign in again next time.', 'ok');
    } catch (e: any) {
      onDone(e.message, 'danger');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 space-y-2.5">
      <input
        type="password"
        value={oldPw}
        onChange={(e) => setOldPw(e.target.value)}
        placeholder="Current password"
        autoComplete="current-password"
        className={inputClass}
      />
      <input
        type="password"
        value={newPw}
        onChange={(e) => setNewPw(e.target.value)}
        placeholder="New password"
        autoComplete="new-password"
        className={inputClass}
      />
      <Button loading={busy} disabled={!oldPw || !newPw} onClick={submit}>
        Change password
      </Button>
    </div>
  );
}
