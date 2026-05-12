const API_ROOT = import.meta.env.VITE_API_ROOT ?? '/api';

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

export async function apiGet<T>(path: string, token?: string): Promise<T> {
  const headers: HeadersInit = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_ROOT}${path}`, { headers });
  const payload = await parseJson(res);
  if (!res.ok) {
    const msg =
      typeof payload === 'object' && payload && 'message' in payload
        ? String((payload as { message?: string }).message)
        : res.statusText;
    throw new ApiError(msg || 'Request failed', res.status, payload);
  }
  return payload as T;
}

export async function apiPostJson<T>(path: string, body: unknown, token?: string): Promise<T> {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_ROOT}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  const payload = await parseJson(res);
  if (!res.ok) {
    const msg =
      typeof payload === 'object' && payload && 'message' in payload
        ? String((payload as { message?: string }).message)
        : res.statusText;
    throw new ApiError(msg || 'Request failed', res.status, payload);
  }
  return payload as T;
}

export async function apiPatchJson<T>(path: string, body: unknown, token?: string): Promise<T> {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_ROOT}${path}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body)
  });
  const payload = await parseJson(res);
  if (!res.ok) {
    const msg =
      typeof payload === 'object' && payload && 'message' in payload
        ? String((payload as { message?: string }).message)
        : res.statusText;
    throw new ApiError(msg || 'Request failed', res.status, payload);
  }
  return payload as T;
}

export async function apiDelete<T>(path: string, token?: string): Promise<T> {
  const headers: HeadersInit = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_ROOT}${path}`, { method: 'DELETE', headers });
  const payload = await parseJson(res);
  if (!res.ok) {
    const msg =
      typeof payload === 'object' && payload && 'message' in payload
        ? String((payload as { message?: string }).message)
        : res.statusText;
    throw new ApiError(msg || 'Request failed', res.status, payload);
  }
  return payload as T;
}

export async function apiPostMultipart<T>(path: string, form: FormData): Promise<T> {
  const res = await fetch(`${API_ROOT}${path}`, {
    method: 'POST',
    body: form
  });
  const payload = await parseJson(res);
  if (!res.ok) {
    const msg =
      typeof payload === 'object' && payload && 'message' in payload
        ? String((payload as { message?: string }).message)
        : res.statusText;
    throw new ApiError(msg || 'Request failed', res.status, payload);
  }
  return payload as T;
}
