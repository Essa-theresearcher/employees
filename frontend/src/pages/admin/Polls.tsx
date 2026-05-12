import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPostJson, ApiError } from '../../lib/api';
import { clearAdminToken, getAdminToken } from '../../lib/auth';

type PollAdminRow = {
  id: string;
  question: string;
  options: string[];
  isActive: boolean;
  createdAt: string;
  totalVotes: number;
  results: Array<{ option: string; count: number; percent: number }>;
};

export function AdminPollsPage() {
  const navigate = useNavigate();
  const token = getAdminToken()!;

  const [rows, setRows] = useState<PollAdminRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await apiGet<{ success: boolean; data: PollAdminRow[] }>('/admin/polls', token);
      setRows(res.data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearAdminToken();
        navigate('/admin/login', { replace: true });
        return;
      }
      setError('Could not load polls.');
    }
  }, [navigate, token]);

  useEffect(() => {
    void load();
    const id = window.setInterval(load, 8000);
    return () => window.clearInterval(id);
  }, [load]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    const opts = options.map((o) => o.trim()).filter(Boolean);
    if (opts.length < 2 || opts.length > 6) {
      setError('Polls need between 2 and 6 non-empty options.');
      return;
    }
    setCreating(true);
    setError(null);
    try {
      await apiPostJson('/polls', { question: question.trim(), options: opts }, token);
      setQuestion('');
      setOptions(['', '']);
      await load();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError('Could not create poll.');
    } finally {
      setCreating(false);
    }
  }

  async function activate(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await apiPostJson(`/polls/${encodeURIComponent(id)}/activate`, {}, token);
      await load();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError('Could not activate poll.');
    } finally {
      setBusyId(null);
    }
  }

  async function deactivate(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await apiPostJson(`/polls/${encodeURIComponent(id)}/deactivate`, {}, token);
      await load();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError('Could not deactivate poll.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-900">Live polls</h1>
        <p className="text-sm text-slate-600">Create, activate, and deactivate polls for the room.</p>
      </div>

      {error && <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <form className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" onSubmit={onCreate}>
        <h2 className="text-sm font-semibold text-brand-900">Create poll</h2>
        <label className="block text-sm font-medium text-slate-700">
          Question
          <input
            required
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-500/30 focus:ring-4"
          />
        </label>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Options (2–6)</p>
          {options.map((opt, i) => (
            <input
              key={i}
              value={opt}
              onChange={(e) => {
                const next = [...options];
                next[i] = e.target.value;
                setOptions(next);
              }}
              placeholder={`Option ${i + 1}`}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-500/30 focus:ring-4"
            />
          ))}
          {options.length < 6 && (
            <button
              type="button"
              onClick={() => setOptions((o) => [...o, ''])}
              className="text-sm font-semibold text-brand-800 hover:text-brand-950"
            >
              + Add option
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={creating}
          className="rounded-2xl bg-brand-900 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {creating ? 'Creating…' : 'Create poll'}
        </button>
      </form>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-brand-900">All polls</h2>
        {rows.length === 0 && <p className="text-sm text-slate-500">No polls yet.</p>}
        {rows.map((p) => (
          <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{p.question}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {p.isActive ? (
                    <span className="font-semibold text-emerald-700">Active</span>
                  ) : (
                    <span>Inactive</span>
                  )}{' '}
                  · {p.totalVotes} votes · {new Date(p.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {!p.isActive ? (
                  <button
                    type="button"
                    disabled={busyId === p.id}
                    onClick={() => void activate(p.id)}
                    className="rounded-xl bg-brand-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                  >
                    {busyId === p.id ? '…' : 'Activate'}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busyId === p.id}
                    onClick={() => void deactivate(p.id)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {busyId === p.id ? '…' : 'Deactivate'}
                  </button>
                )}
              </div>
            </div>
            <ul className="mt-3 space-y-1 text-sm text-slate-700">
              {p.results.map((r) => (
                <li key={r.option} className="flex justify-between gap-2">
                  <span>{r.option}</span>
                  <span className="shrink-0 text-slate-600">
                    {r.count} ({r.percent}%)
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
