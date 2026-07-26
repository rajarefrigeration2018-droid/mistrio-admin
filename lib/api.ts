// lib/api.ts
// Single entry point for every backend call.
// Handles the token, the response envelope, and session expiry.

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const TOKEN_KEY = 'mistrio_admin_token';

export type Envelope<T> = {
  success: boolean;
  message: string;
  data: T;
  error_code: string | null;
};

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(message: string, code = 'ERROR', status = 500) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

type Options = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  raw?: boolean; // return the Response itself (for CSV downloads)
};

export async function api<T = any>(path: string, opts: Options = {}): Promise<T> {
  const { method = 'GET', body, query, raw } = opts;

  let url = `${API_URL}${path}`;
  if (query) {
    const qs = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.append(k, String(v));
    });
    const s = qs.toString();
    if (s) url += `?${s}`;
  }

  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let res: Response;
  try {
    res = await fetch(url, { method, headers, body: payload, cache: 'no-store' });
  } catch {
    throw new ApiError('Cannot reach the server. Check your connection.', 'NETWORK', 0);
  }

  if (raw) {
    if (!res.ok) throw new ApiError('Download failed', 'DOWNLOAD_FAILED', res.status);
    return res as unknown as T;
  }

  let json: Envelope<T> | { detail?: any };
  try {
    json = await res.json();
  } catch {
    throw new ApiError('The server returned an unexpected response.', 'BAD_RESPONSE', res.status);
  }

  if (!res.ok) {
    const detail = (json as any).detail ?? json;
    const message = detail?.message || detail?.detail || 'Something went wrong.';
    const code = detail?.error_code || `HTTP_${res.status}`;

    if (res.status === 401 && typeof window !== 'undefined') {
      clearToken();
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login?expired=1';
      }
    }
    throw new ApiError(message, code, res.status);
  }

  return (json as Envelope<T>).data;
}

/** Downloads a CSV report and triggers the browser save dialog. */
export async function downloadCsv(path: string, query: Record<string, any>, filename: string) {
  const res = await api<Response>(path, { query, raw: true });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
