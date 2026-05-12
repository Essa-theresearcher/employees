import { type FormEvent, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { apiPostJson, ApiError } from '../../lib/api';
import { getAdminToken, setAdminToken } from '../../lib/auth';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const useClientSupabaseAuth = Boolean(supabaseUrl && supabaseAnonKey);

export function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/admin/dashboard';

  const [email, setEmail] = useState('admin@coffeeandcode.com');
  const [password, setPassword] = useState('ChangeMe123!');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (getAdminToken()) return <Navigate to={from} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (useClientSupabaseAuth) {
        const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
        const { data, error: sbError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password
        });
        if (sbError) {
          setError(sbError.message);
          return;
        }
        if (data.session?.access_token) {
          setAdminToken(data.session.access_token);
          navigate(from, { replace: true });
          return;
        }
        setError('No session returned from Supabase.');
        return;
      }

      const res = await apiPostJson<{ success: boolean; data: { token: string } }>('/admin/login', {
        email,
        password
      });
      setAdminToken(res.data.token);
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError('Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-gradient-to-b from-brand-50 to-white px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-brand-100 bg-white p-8 shadow-soft">
        <h1 className="text-2xl font-bold text-brand-900">Admin login</h1>
        <p className="mt-2 text-sm text-slate-600">
          {useClientSupabaseAuth
            ? 'Sign in with your Supabase Auth organizer account.'
            : 'Sign in to verify payments and issue badges.'}
        </p>

        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-500/30 focus:ring-4"
              autoComplete="username"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-500/30 focus:ring-4"
              autoComplete="current-password"
            />
          </label>

          {error && <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-brand-900 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
