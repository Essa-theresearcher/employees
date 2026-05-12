import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiDelete, apiGet, apiPostJson, ApiError } from '../../lib/api';
import { clearAdminToken, getAdminToken } from '../../lib/auth';

type Metrics = {
  totalQuestions: number;
  unansweredQuestions: number;
  topQuestion: { id: string; questionText: string; upvotes: number; attendeeName: string } | null;
};

type Question = {
  id: string;
  attendeeName: string;
  questionText: string;
  upvotes: number;
  isAnswered: boolean;
  createdAt: string;
};

const REFRESH_MS = 8000;

export function AdminQAPage() {
  const navigate = useNavigate();
  const token = getAdminToken()!;
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [rows, setRows] = useState<Question[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [m, q] = await Promise.all([
        apiGet<{ success: boolean; data: Metrics }>('/admin/qa/metrics', token),
        apiGet<{ success: boolean; data: Question[] }>('/admin/qa/questions', token)
      ]);
      setMetrics(m.data);
      setRows(q.data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearAdminToken();
        navigate('/admin/login', { replace: true });
        return;
      }
      setError('Could not load Q&A data.');
    }
  }, [navigate, token]);

  useEffect(() => {
    void load();
    const id = window.setInterval(load, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [load]);

  async function mark(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await apiPostJson(`/questions/${encodeURIComponent(id)}/answered`, {}, token);
      await load();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError('Could not update question.');
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this question?')) return;
    setBusyId(id);
    setError(null);
    try {
      await apiDelete(`/questions/${encodeURIComponent(id)}`, token);
      await load();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError('Could not delete question.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-900">Q&amp;A moderation</h1>
        <p className="text-sm text-slate-600">Mark answered or remove inappropriate questions.</p>
      </div>

      {error && <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total questions', value: metrics?.totalQuestions ?? '—' },
          { label: 'Unanswered', value: metrics?.unansweredQuestions ?? '—' },
          {
            label: 'Top voted',
            value: metrics?.topQuestion
              ? `${metrics.topQuestion.questionText.slice(0, 60)}${
                  metrics.topQuestion.questionText.length > 60 ? '…' : ''
                } (${metrics.topQuestion.upvotes})`
              : '—'
          }
        ].map((c) => (
          <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{c.label}</p>
            <p className="mt-2 text-sm font-bold text-brand-900">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-[720px] w-full divide-y divide-slate-200 text-left text-xs sm:text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Votes</th>
              <th className="px-3 py-2">Name</th>
              <th className="min-w-[200px] px-3 py-2">Question</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                  No questions yet
                </td>
              </tr>
            )}
            {rows.map((q) => (
              <tr key={q.id}>
                <td className="whitespace-nowrap px-3 py-2 font-semibold text-brand-900">{q.upvotes}</td>
                <td className="whitespace-nowrap px-3 py-2 text-slate-700">{q.attendeeName}</td>
                <td className="max-w-[320px] px-3 py-2 text-slate-800">{q.questionText}</td>
                <td className="whitespace-nowrap px-3 py-2">
                  {q.isAnswered ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">
                      Answered
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900">
                      Open
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    {!q.isAnswered && (
                      <button
                        type="button"
                        disabled={busyId === q.id}
                        onClick={() => void mark(q.id)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                      >
                        {busyId === q.id ? '…' : 'Mark answered'}
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={busyId === q.id}
                      onClick={() => void remove(q.id)}
                      className="rounded-xl border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-800 hover:bg-red-100 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
