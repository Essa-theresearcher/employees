const API_ROOT = import.meta.env.VITE_API_ROOT ?? '/api';

/** Absolute URL for payment screenshots (Supabase public URL or legacy /uploads path). */
export function resolveScreenshotUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;

  const originOverride = (import.meta.env.VITE_ASSET_ORIGIN as string | undefined)?.replace(/\/$/, '');
  if (originOverride) return `${originOverride}${path.startsWith('/') ? path : `/${path}`}`;

  if (typeof window !== 'undefined' && API_ROOT.startsWith('/')) {
    return `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`;
  }

  if (API_ROOT.startsWith('http')) {
    try {
      const u = new URL(API_ROOT);
      return `${u.origin}${path.startsWith('/') ? path : `/${path}`}`;
    } catch {
      return path;
    }
  }

  return path.startsWith('/') ? path : `/${path}`;
}
