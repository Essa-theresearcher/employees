import { type FormEvent, useEffect, useState } from 'react';
import { apiDelete, apiGet, apiPatchJson, apiPostJson, ApiError } from '../../lib/api';
import { clearAdminToken, getAdminToken } from '../../lib/auth';
import { Link, useNavigate } from 'react-router-dom';

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

type CheckinMetrics = {
  totalRegistered: number;
  paymentApproved: number;
  checkedIn: number;
  notCheckedIn: number;
};

type TeamMetrics = {
  totalTeams: number;
  checkedInAttendees: number;
  attendeesInTeams: number;
  attendeesWithoutTeams: number;
};

type JudgingMetrics = {
  totalTeams: number;
  totalScoresSubmitted: number;
  averageEventScore: number | null;
  highestScoringTeam: { teamName: string; averageScore: number } | null;
};

type JudgingScoreRow = {
  id: string;
  teamId: string;
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

type QaMetrics = {
  totalQuestions: number;
  unansweredQuestions: number;
  topQuestion: { id: string; questionText: string; upvotes: number; attendeeName: string } | null;
};

type QuestionRow = {
  id: string;
  attendeeName: string;
  questionText: string;
  upvotes: number;
  isAnswered: boolean;
  createdAt: string;
};

type PollAdminRow = {
  id: string;
  question: string;
  options: string[];
  isActive: boolean;
  createdAt: string;
  totalVotes: number;
  results: Array<{ option: string; count: number; percent: number }>;
};

type EventDto = {
  eventName: string;
  amountKes: number;
  mpesaChannelLabel: string;
  mpesaTillOrPaybill: string;
  accountReferenceHint: string;
  scheduleNote: string;
};

export function AdminDashboard() {
  const navigate = useNavigate();
  const token = getAdminToken()!;
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [checkin, setCheckin] = useState<CheckinMetrics | null>(null);
  const [teams, setTeams] = useState<TeamMetrics | null>(null);
  const [judging, setJudging] = useState<JudgingMetrics | null>(null);
  const [judgingScores, setJudgingScores] = useState<JudgingScoreRow[]>([]);
  const [event, setEvent] = useState<EventDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [qaMetrics, setQaMetrics] = useState<QaMetrics | null>(null);
  const [qaQuestions, setQaQuestions] = useState<QuestionRow[]>([]);
  const [adminPolls, setAdminPolls] = useState<PollAdminRow[]>([]);
  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [newPollOptions, setNewPollOptions] = useState<string[]>(['', '']);
  const [pollSaving, setPollSaving] = useState(false);
  const [qaBusyId, setQaBusyId] = useState<string | null>(null);
  const [pollBusyId, setPollBusyId] = useState<string | null>(null);

  const [amountKes, setAmountKes] = useState('');
  const [mpesaLabel, setMpesaLabel] = useState('');
  const [mpesa, setMpesa] = useState('');
  const [hint, setHint] = useState('');
  const [scheduleNote, setScheduleNote] = useState('');
  const [eventName, setEventName] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    setError(null);
    try {
      const [m, e, c, t, j, js, qm, qq, pl] = await Promise.all([
        apiGet<{ success: boolean; data: Metrics }>('/admin/metrics', token),
        apiGet<{ success: boolean; data: EventDto }>('/admin/event', token),
        apiGet<{ success: boolean; data: CheckinMetrics }>('/admin/checkin/metrics', token),
        apiGet<{ success: boolean; data: TeamMetrics }>('/admin/teams/metrics', token),
        apiGet<{ success: boolean; data: JudgingMetrics }>('/admin/judging/metrics', token),
        apiGet<{ success: boolean; data: JudgingScoreRow[] }>('/admin/judging/scores', token),
        apiGet<{ success: boolean; data: QaMetrics }>('/admin/qa/metrics', token),
        apiGet<{ success: boolean; data: QuestionRow[] }>('/admin/qa/questions', token),
        apiGet<{ success: boolean; data: PollAdminRow[] }>('/admin/polls', token)
      ]);
      setMetrics(m.data);
      setEvent(e.data);
      setCheckin(c.data);
      setTeams(t.data);
      setJudging(j.data);
      setJudgingScores(js.data);
      setQaMetrics(qm.data);
      setQaQuestions(qq.data);
      setAdminPolls(pl.data);
      setAmountKes(String(e.data.amountKes));
      setMpesaLabel(e.data.mpesaChannelLabel);
      setMpesa(e.data.mpesaTillOrPaybill);
      setHint(e.data.accountReferenceHint);
      setScheduleNote(e.data.scheduleNote ?? '');
      setEventName(e.data.eventName);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearAdminToken();
        navigate('/admin/login', { replace: true });
        return;
      }
      setError('Could not load dashboard.');
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSaveEvent(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const parsedAmount = Number(amountKes);
      await apiPatchJson(
        '/admin/event',
        {
          eventName: eventName.trim(),
          amountKes: parsedAmount,
          mpesaChannelLabel: mpesaLabel.trim(),
          mpesaTillOrPaybill: mpesa.trim(),
          accountReferenceHint: hint.trim(),
          scheduleNote: scheduleNote.trim()
        },
        token
      );
      await load();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError('Save failed');
    } finally {
      setSaving(false);
    }
  }

  function logout() {
    clearAdminToken();
    navigate('/admin/login', { replace: true });
  }

  async function onMarkAnswered(id: string) {
    setQaBusyId(id);
    setError(null);
    try {
      await apiPostJson(`/questions/${encodeURIComponent(id)}/answered`, {}, token);
      await load();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError('Could not update question.');
    } finally {
      setQaBusyId(null);
    }
  }

  async function onDeleteQuestion(id: string) {
    if (!window.confirm('Delete this question?')) return;
    setQaBusyId(id);
    setError(null);
    try {
      await apiDelete(`/questions/${encodeURIComponent(id)}`, token);
      await load();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError('Could not delete question.');
    } finally {
      setQaBusyId(null);
    }
  }

  async function onCreatePoll(e: FormEvent) {
    e.preventDefault();
    const opts = newPollOptions.map((o) => o.trim()).filter(Boolean);
    if (opts.length < 2 || opts.length > 6) {
      setError('Polls need between 2 and 6 non-empty options.');
      return;
    }
    setPollSaving(true);
    setError(null);
    try {
      await apiPostJson('/polls', { question: newPollQuestion.trim(), options: opts }, token);
      setNewPollQuestion('');
      setNewPollOptions(['', '']);
      await load();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError('Could not create poll.');
    } finally {
      setPollSaving(false);
    }
  }

  async function onActivatePoll(id: string) {
    setPollBusyId(id);
    setError(null);
    try {
      await apiPostJson(`/polls/${encodeURIComponent(id)}/activate`, {}, token);
      await load();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError('Could not activate poll.');
    } finally {
      setPollBusyId(null);
    }
  }

  async function onDeactivatePoll(id: string) {
    setPollBusyId(id);
    setError(null);
    try {
      await apiPostJson(`/polls/${encodeURIComponent(id)}/deactivate`, {}, token);
      await load();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError('Could not deactivate poll.');
    } finally {
      setPollBusyId(null);
    }
  }

  const cards = metrics
    ? [
        { label: 'Total registered', value: metrics.totalRegistered },
        { label: 'Pending payments', value: metrics.pendingPayments },
        { label: 'Verified attendees', value: metrics.verifiedAttendees },
        { label: 'Rejected', value: metrics.rejectedRegistrations },
        {
          label: 'Expected revenue (non-rejected)',
          value: `Ksh ${metrics.totalExpectedRevenue.toLocaleString()}`
        },
        { label: 'Verified revenue', value: `Ksh ${metrics.totalVerifiedRevenue.toLocaleString()}` }
      ]
    : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">{metrics?.eventName ?? event?.eventName ?? 'Coffee & Code'}</p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          Log out
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="rounded-3xl border border-sky-200 bg-gradient-to-r from-sky-50 to-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-sky-950">Venue projector</h2>
            <p className="mt-1 max-w-2xl text-sm text-sky-900/85">
              Open this link on the hall laptop in a clean browser window (or guest profile). It only shows public live
              displays — no admin sidebar, payments, or attendee data.
            </p>
          </div>
          <Link
            to="/projector"
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded-2xl bg-sky-900 px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-sky-800"
          >
            Open projector menu
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{c.label}</p>
            <p className="mt-3 text-2xl font-bold text-brand-900">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-brand-900">Event Check-In</h2>
            <p className="mt-1 text-sm text-slate-600">
              Live count of attendees who arrived at the door.
            </p>
          </div>
          <Link
            to="/admin/checkin"
            className="rounded-2xl bg-brand-900 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Open check-in console
          </Link>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total registered', value: checkin?.totalRegistered ?? '—' },
            { label: 'Payment approved', value: checkin?.paymentApproved ?? '—' },
            { label: 'Checked in', value: checkin?.checkedIn ?? '—' },
            { label: 'Not checked in', value: checkin?.notCheckedIn ?? '—' }
          ].map((c) => (
            <div key={c.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{c.label}</p>
              <p className="mt-2 text-xl font-bold text-brand-900">{c.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-brand-900">Team Formation</h2>
            <p className="mt-1 text-sm text-slate-600">
              Builders organizing themselves into project teams.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/teams/display"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Projector view
            </Link>
            <Link
              to="/admin/teams"
              className="rounded-2xl bg-brand-900 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Manage teams
            </Link>
          </div>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total teams', value: teams?.totalTeams ?? '—' },
            { label: 'Checked-in attendees', value: teams?.checkedInAttendees ?? '—' },
            { label: 'Assigned to teams', value: teams?.attendeesInTeams ?? '—' },
            { label: 'Without a team', value: teams?.attendeesWithoutTeams ?? '—' }
          ].map((c) => (
            <div key={c.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{c.label}</p>
              <p className="mt-2 text-xl font-bold text-brand-900">{c.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-brand-900">Judging Scores</h2>
            <p className="mt-1 text-sm text-slate-600">Hackathon judging and live leaderboard data.</p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/leaderboard/display"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Projector leaderboard
            </Link>
            <Link
              to="/judge"
              className="rounded-2xl bg-brand-900 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Judge scoring
            </Link>
          </div>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total teams', value: judging?.totalTeams ?? '—' },
            { label: 'Total scores submitted', value: judging?.totalScoresSubmitted ?? '—' },
            {
              label: 'Average event score',
              value:
                judging?.averageEventScore != null ? judging.averageEventScore.toFixed(2) : '—'
            },
            {
              label: 'Highest scoring team',
              value: judging?.highestScoringTeam
                ? `${judging.highestScoringTeam.teamName} (${judging.highestScoringTeam.averageScore.toFixed(2)})`
                : '—'
            }
          ].map((c) => (
            <div key={c.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{c.label}</p>
              <p className="mt-2 text-sm font-bold text-brand-900">{c.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-100">
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
              {judgingScores.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-slate-500">
                    No scores submitted yet
                  </td>
                </tr>
              )}
              {judgingScores.map((s) => (
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

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-brand-900">Live Q&amp;A</h2>
            <p className="mt-1 text-sm text-slate-600">Audience questions and upvotes.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/qa"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Open Q&amp;A
            </Link>
            <Link
              to="/qa/display"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Q&amp;A display
            </Link>
          </div>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Total questions', value: qaMetrics?.totalQuestions ?? '—' },
            { label: 'Unanswered', value: qaMetrics?.unansweredQuestions ?? '—' },
            {
              label: 'Top voted',
              value: qaMetrics?.topQuestion
                ? `${qaMetrics.topQuestion.questionText.slice(0, 80)}${
                    qaMetrics.topQuestion.questionText.length > 80 ? '…' : ''
                  } (${qaMetrics.topQuestion.upvotes} votes)`
                : '—'
            }
          ].map((c) => (
            <div key={c.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{c.label}</p>
              <p className="mt-2 text-sm font-bold text-brand-900">{c.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-100">
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
              {qaQuestions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                    No questions yet
                  </td>
                </tr>
              )}
              {qaQuestions.map((q) => (
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
                          disabled={qaBusyId === q.id}
                          onClick={() => void onMarkAnswered(q.id)}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                        >
                          {qaBusyId === q.id ? '…' : 'Mark answered'}
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={qaBusyId === q.id}
                        onClick={() => void onDeleteQuestion(q.id)}
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

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-brand-900">Live Polls</h2>
            <p className="mt-1 text-sm text-slate-600">One active poll at a time for the room.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/polls"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Open polls
            </Link>
            <Link
              to="/polls/display"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Poll display
            </Link>
          </div>
        </div>

        <form className="mt-6 space-y-4" onSubmit={onCreatePoll}>
          <h3 className="text-sm font-semibold text-brand-900">Create poll</h3>
          <label className="block text-sm font-medium text-slate-700">
            Question
            <input
              required
              value={newPollQuestion}
              onChange={(e) => setNewPollQuestion(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-500/30 focus:ring-4"
            />
          </label>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Options (2–6)</p>
            {newPollOptions.map((opt, i) => (
              <input
                key={i}
                value={opt}
                onChange={(e) => {
                  const next = [...newPollOptions];
                  next[i] = e.target.value;
                  setNewPollOptions(next);
                }}
                placeholder={`Option ${i + 1}`}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-500/30 focus:ring-4"
              />
            ))}
            {newPollOptions.length < 6 && (
              <button
                type="button"
                onClick={() => setNewPollOptions((o) => [...o, ''])}
                className="text-sm font-semibold text-brand-800 hover:text-brand-950"
              >
                + Add option
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={pollSaving}
            className="rounded-2xl bg-brand-900 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {pollSaving ? 'Creating…' : 'Create poll'}
          </button>
        </form>

        <div className="mt-8 space-y-6">
          <h3 className="text-sm font-semibold text-brand-900">All polls</h3>
          {adminPolls.length === 0 && <p className="text-sm text-slate-500">No polls yet.</p>}
          {adminPolls.map((p) => (
            <div key={p.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
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
                  {!p.isActive && (
                    <button
                      type="button"
                      disabled={pollBusyId === p.id}
                      onClick={() => void onActivatePoll(p.id)}
                      className="rounded-xl bg-brand-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                    >
                      {pollBusyId === p.id ? '…' : 'Activate'}
                    </button>
                  )}
                  {p.isActive && (
                    <button
                      type="button"
                      disabled={pollBusyId === p.id}
                      onClick={() => void onDeactivatePoll(p.id)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                    >
                      {pollBusyId === p.id ? '…' : 'Deactivate'}
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

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-brand-900">Public payment instructions</h2>
        <p className="mt-1 text-sm text-slate-600">
          These values appear on the registration page. Updating here updates what attendees see on refresh.
        </p>

        <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={onSaveEvent}>
          <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
            Event title
            <input
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-500/30 focus:ring-4"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Amount (Ksh)
            <input
              value={amountKes}
              onChange={(e) => setAmountKes(e.target.value)}
              type="number"
              min={1}
              step={1}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-500/30 focus:ring-4"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            M-Pesa channel label
            <input
              value={mpesaLabel}
              onChange={(e) => setMpesaLabel(e.target.value)}
              placeholder="e.g. Send Money"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-500/30 focus:ring-4"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Phone / Till / Paybill number
            <input
              value={mpesa}
              onChange={(e) => setMpesa(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-500/30 focus:ring-4"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
            Schedule note (shown publicly)
            <input
              value={scheduleNote}
              onChange={(e) => setScheduleNote(e.target.value)}
              placeholder="e.g. Please arrive from 4:30 PM onward."
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-500/30 focus:ring-4"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
            Account reference hint
            <input
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-500/30 focus:ring-4"
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-brand-900 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
