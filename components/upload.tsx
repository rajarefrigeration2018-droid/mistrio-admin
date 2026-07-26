// components/upload.tsx
'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { API_URL, getToken } from '@/lib/api';

/** Uploads to Supabase Storage through the backend and returns the public URL. */
export function ImageUpload({
  value, onChange, folder = 'services', label = 'Image',
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  folder?: string;
  label?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function pick(file: File) {
    setError('');
    setBusy(true);
    try {
      const form = new FormData();
      form.append('folder', folder);
      form.append('file', file);

      const res = await fetch(`${API_URL}/admin/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: form,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.detail?.message || 'Upload failed');
      onChange(json.data.url);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <span className="eyebrow">{label}</span>
      <div className="mt-1.5">
        {value ? (
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt=""
              className="h-24 w-24 rounded-lg border border-line object-cover"
            />
            <button
              onClick={() => onChange(null)}
              aria-label="Remove image"
              className="absolute -right-2 -top-2 rounded-full bg-ink p-1 text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => input.current?.click()}
            disabled={busy}
            className="press flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-line bg-paper text-muted"
          >
            {busy ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <ImagePlus className="h-5 w-5" />
                <span className="text-2xs">Add</span>
              </>
            )}
          </button>
        )}
        <input
          ref={input}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) pick(f);
            e.target.value = '';
          }}
        />
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
