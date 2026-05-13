/** Base URL for API calls. Paths in this app are like `/event`, `/admin/login` (they already include leading slash). */
function normalizeApiRoot(raw: string | undefined): string {
  const v = (raw ?? '/api').trim();
  const base = v.replace(/\/+$/, '');
  if (base === '' || base === '/api') return '/api';
  if (base.endsWith('/api')) return base;
  if (/^https?:\/\//i.test(base)) return `${base}/api`;
  return base.startsWith('/') ? base : `/${base}`;
}

const API_ROOT = normalizeApiRoot(import.meta.env.VITE_API_ROOT as string | undefined);

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function statusFallbackMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Bad request';
    case 401:
      return 'Unauthorized — sign in again';
    case 403:
      return 'Forbidden';
    case 404:
      return 'Not found — check the API URL (missing /api?)';
    case 409:
      return 'Conflict — request could not be completed';
    case 413:
      return 'Payload too large';
    case 429:
      return 'Too many requests';
    case 502:
    case 503:
    case 504:
      return `Server unavailable (${status}) — try again shortly`;
    default:
      return status ? `HTTP ${status}` : 'Network or server error';
  }
}

/** Best-effort message for failed responses (JSON API, HTML error pages, empty body). */
function extractErrorMessage(res: Response, payload: unknown): string {
  if (typeof payload === 'object' && payload !== null) {
    const o = payload as { message?: unknown; error?: unknown };
    if (typeof o.message === 'string' && o.message.trim()) return o.message.trim();
    if (typeof o.error === 'string' && o.error.trim()) return o.error.trim();
  }
  if (typeof payload === 'string') {
    const t = payload.trim();
    if (!t) return statusFallbackMessage(res.status);
    if (t.startsWith('<')) return `${res.status} ${res.statusText || 'Error'} — server returned HTML (wrong URL or proxy error)`;
    return t.length > 180 ? `${t.slice(0, 180)}…` : t;
  }
  const st = res.statusText?.trim();
  if (st) return `${res.status} ${st}`;
  return statusFallbackMessage(res.status);
}

async function doFetch(url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (e) {
    const hint =
      e instanceof TypeError
        ? 'Network error (offline, wrong API URL, or browser blocked the request — check CORS on the server).'
        : 'Request could not be sent.';
    throw new ApiError(hint, 0, e);
  }
}

export async function apiGet<T>(path: string, token?: string): Promise<T> {
  const headers: HeadersInit = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await doFetch(`${API_ROOT}${path}`, { headers });
  const payload = await parseJson(res);
  if (!res.ok) {
    throw new ApiError(extractErrorMessage(res, payload), res.status, payload);
  }
  return payload as T;
}

export async function apiPostJson<T>(path: string, body: unknown, token?: string): Promise<T> {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await doFetch(`${API_ROOT}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  const payload = await parseJson(res);
  if (!res.ok) {
    throw new ApiError(extractErrorMessage(res, payload), res.status, payload);
  }
  return payload as T;
}

export async function apiPatchJson<T>(path: string, body: unknown, token?: string): Promise<T> {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await doFetch(`${API_ROOT}${path}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body)
  });
  const payload = await parseJson(res);
  if (!res.ok) {
    throw new ApiError(extractErrorMessage(res, payload), res.status, payload);
  }
  return payload as T;
}

export async function apiDelete<T>(path: string, token?: string): Promise<T> {
  const headers: HeadersInit = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await doFetch(`${API_ROOT}${path}`, { method: 'DELETE', headers });
  const payload = await parseJson(res);
  if (!res.ok) {
    throw new ApiError(extractErrorMessage(res, payload), res.status, payload);
  }
  return payload as T;
}

export async function apiPostMultipart<T>(path: string, form: FormData): Promise<T> {
  const res = await doFetch(`${API_ROOT}${path}`, {
    method: 'POST',
    body: form
  });
  const payload = await parseJson(res);
  if (!res.ok) {
    throw new ApiError(extractErrorMessage(res, payload), res.status, payload);
  }
  return payload as T;
}
