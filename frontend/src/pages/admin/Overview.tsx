import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiGet, ApiError } from '../../lib/api';
import { clearAdminToken, getAdminToken } from '../../lib/auth';

type Metrics = {
  totalRegistered: number;
  pendingPayments: number;
  verifiedAttendees: number;
  rejectedRegistrations: number;
  totalExpectedRevenue: number;
  totalVerifiedRevenue: number;
  ticketAmountKes: number;
  eventName: string;
};

type CheckinMetrics = { totalRegistered: number; paymentApproved: number; checkedIn: number; notCheckedIn: number };
type TeamMetrics = { totalTeams: number; checkedInAttendees: number; attendeesInTeams: number; attendeesWithoutTeams: number };
type JudgingMetrics = {
  totalTeams: number;
  totalScoresSubmitted: number;
  averageEventScore: number | null;
  highestScoringTeam: { teamName: string; averageScore: number } | null;
};
type QaMetrics = {
  totalQuestions: number;
  unansweredQuestions: number;
  topQuestion: { questionText: string; upvotes: number } | null;
};
type PollAdminRow = { id: string; question: string; isActive: boolean; totalVotes: number };

export function AdminOverviewPage() {
  const navigate = useNavigate();
  const token = getAdminToken()!;

  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [checkin, setCheckin] = useState<CheckinMetrics | null>(null);
  const [teams, setTeams] = useState<TeamMetrics | null>(null);
  const [judging, setJudging] = useState<JudgingMetrics | null>(null);
  const [qa, setQa] = useState<QaMetrics | null>(null);
  const [polls, setPolls] = useState<PollAdminRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [m, c, t, j, q, p] = await Promise.all([
        apiGet<{ success: boolean; data: Metrics }>('/admin/metrics', token),
        apiGet<{ success: boolean; data: CheckinMetrics }>('/admin/checkin/metrics', token),
        apiGet<{ success: boolean; data: TeamMetrics }>('/admin/teams/metrics', token),
        apiGet<{ success: boolean; data: JudgingMetrics }>('/admin/judging/metrics', token),
        apiGet<{ success: boolean; data: QaMetrics }>('/admin/qa/metrics', token),
        apiGet<{ success: boolean; data: PollAdminRow[] }>('/admin/polls', token)
      ]);
      setMetrics(m.data);
      setCheckin(c.data);
      setTeams(t.data);
      setJudging(j.data);
      setQa(q.data);
      setPolls(p.data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearAdminToken();
        navigate('/admin/login', { replace: true });
        return;
      }
      setError('Could not load overview.');
    }
  }, [navigate, token]);

  useEffect(() => {
    void load();
    const id = window.setInterval(load, 15000);
    return () => window.clearInterval(id);
  }, [load]);

  const activePoll = polls.find((p) => p.isActive) ?? null;

  const cards: Array<{ label: string; value: number | string; to?: string }> = [
    { label: 'Total registrations', value: metrics?.totalRegistered ?? '—', to: '/admin/registrations' },
    { label: 'Approved payments', value: metrics?.verifiedAttendees ?? '—', to: '/admin/payments' },
    { label: 'Pending payments', value: metrics?.pendingPayments ?? '—', to: '/admin/payments' },
    { label: 'Checked-in attendees', value: checkin?.checkedIn ?? '—', to: '/admin/check-in' },
    { label: 'Teams', value: teams?.totalTeams ?? '—', to: '/admin/teams' },
    { label: 'Scores submitted', value: judging?.totalScoresSubmitted ?? '—', to: '/admin/judging' },
    { label: 'Questions submitted', value: qa?.totalQuestions ?? '—', to: '/admin/qa' },
    {
      label: 'Active poll',
      value: activePoll ? activePoll.question.slice(0, 40) + (activePoll.question.length > 40 ? '…' : '') : 'None',
      to: '/admin/polls'
    },
    { label: 'Certificates generated', value: '—', to: '/admin/certificates' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Admin Control Room</p>
        <h1 className="text-2xl font-bold text-brand-900">Overview</h1>
        <p className="text-sm text-slate-600">{metrics?.eventName ?? 'Coffee & Code'}</p>
      </div>

      {error && <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => {
          const inner = (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{c.label}</p>
              <p className="mt-2 text-2xl font-bold text-brand-900">{c.value}</p>
            </>
          );
          return c.to ? (
            <Link
              key={c.label}
              to={c.to}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-200 hover:shadow-md"
            >
              {inner}
            </Link>
          ) : (
            <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              {inner}
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Revenue</p>
          <p className="mt-2 text-lg font-bold text-brand-900">
            Verified Ksh {metrics?.totalVerifiedRevenue?.toLocaleString() ?? '—'}
          </p>
          <p className="text-xs text-slate-500">
            Expected (non-rejected) Ksh {metrics?.totalExpectedRevenue?.toLocaleString() ?? '—'}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Highest scoring team</p>
          <p className="mt-2 text-lg font-bold text-brand-900">
            {judging?.highestScoringTeam
              ? `${judging.highestScoringTeam.teamName} (${judging.highestScoringTeam.averageScore.toFixed(2)})`
              : '—'}
          </p>
        </div>
      </div>
    </div>
  );
}
