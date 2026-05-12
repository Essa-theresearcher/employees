import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, ApiError } from '../../lib/api';
import { clearAdminToken, getAdminToken } from '../../lib/auth';

type JudgingMetrics = {
  totalTeams: number;
  totalScoresSubmitted: number;
  averageEventScore: number | null;
  highestScoringTeam: { teamName: string; averageScore: number } | null;
};

type JudgingScoreRow = {
  id: string;
  teamName: string;
  judgeName: string;
  ideaClarityScore: number;
  technicalExecutionScore: number;
  businessValueScore: number;
  presentationScore: number;
  teamworkScore: number;
  totalScore: number;
  comments: string | null;
  createdAt: string;
};

export function AdminJudgingPage() {
  const navigate = useNavigate();
  const token = getAdminToken()!;

  const [metrics, setMetrics] = useState<JudgingMetrics | null>(null);
  const [rows, setRows] = useState<JudgingScoreRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [m, s] = await Promise.all([
        apiGet<{ success: boolean; data: JudgingMetrics }>('/admin/judging/metrics', token),
        apiGet<{ success: boolean; data: JudgingScoreRow[] }>('/admin/judging/scores', token)
      ]);
      setMetrics(m.data);
      setRows(s.data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearAdminToken();
        navigate('/admin/login', { replace: true });
        return;
      }
      setError('Could not load judging data.');
    }
  }, [navigate, token]);

  useEffect(() => {
    void load();
    const id = window.setInterval(load, 10000);
    return () => window.clearInterval(id);
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-900">Judging</h1>
        <p className="text-sm text-slate-600">View submitted scores and monitor judges.</p>
      </div>

      {error && <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total teams', value: metrics?.totalTeams ?? '—' },
          { label: 'Scores submitted', value: metrics?.totalScoresSubmitted ?? '—' },
          {
            label: 'Average event score',
            value: metrics?.averageEventScore != null ? metrics.averageEventScore.toFixed(2) : '—'
          },
          {
            label: 'Highest team',
            value: metrics?.highestScoringTeam
              ? `${metrics.highestScoringTeam.teamName} (${metrics.highestScoringTeam.averageScore.toFixed(2)})`
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
        <table className="min-w-[900px] w-full divide-y divide-slate-200 text-left text-xs sm:text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="whitespace-nowrap px-3 py-2">Team</th>
              <th className="whitespace-nowrap px-3 py-2">Judge</th>
              <th className="whitespace-nowrap px-3 py-2">Idea</th>
              <th className="whitespace-nowrap px-3 py-2">Tech</th>
              <th className="whitespace-nowrap px-3 py-2">Business</th>
              <th className="whitespace-nowrap px-3 py-2">Present</th>
              <th className="whitespace-nowrap px-3 py-2">Teamwork</th>
              <th className="whitespace-nowrap px-3 py-2">Total</th>
              <th className="min-w-[120px] px-3 py-2">Comments</th>
              <th className="whitespace-nowrap px-3 py-2">Submitted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-8 text-center text-slate-500">
                  No scores submitted yet
                </td>
              </tr>
            )}
            {rows.map((s) => (
              <tr key={s.id}>
                <td className="whitespace-nowrap px-3 py-2 font-medium text-slate-900">{s.teamName}</td>
                <td className="whitespace-nowrap px-3 py-2 text-slate-700">{s.judgeName}</td>
                <td className="whitespace-nowrap px-3 py-2">{s.ideaClarityScore}</td>
                <td className="whitespace-nowrap px-3 py-2">{s.technicalExecutionScore}</td>
                <td className="whitespace-nowrap px-3 py-2">{s.businessValueScore}</td>
                <td className="whitespace-nowrap px-3 py-2">{s.presentationScore}</td>
                <td className="whitespace-nowrap px-3 py-2">{s.teamworkScore}</td>
                <td className="whitespace-nowrap px-3 py-2 font-semibold text-brand-900">{s.totalScore}</td>
                <td className="max-w-[200px] truncate px-3 py-2 text-slate-600" title={s.comments ?? ''}>
                  {s.comments ?? '—'}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                  {new Date(s.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
