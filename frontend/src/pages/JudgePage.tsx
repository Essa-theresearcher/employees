import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { apiGet, apiPostJson, ApiError } from '../lib/api';

const JUDGE_NAME_KEY = 'coffee-code-judge-name';

type Team = {
  id: string;
  teamName: string;
  description: string | null;
  memberCount: number;
};

type EventDto = {
  eventName: string;
};

const emptyScores = {
  idea: '',
  technical: '',
  business: '',
  presentation: '',
  teamwork: ''
} as const;

type ScoreKey = keyof typeof emptyScores;
type ScoreState = Record<ScoreKey, string>;

function parse1to10(raw: string): number | null {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 10) return null;
  return n;
}

export function JudgePage() {
  const [eventName, setEventName] = useState('Coffee & Code');
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [judgeName, setJudgeName] = useState('');
  const [teamId, setTeamId] = useState('');
  const [scores, setScores] = useState<ScoreState>({ ...emptyScores });
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(JUDGE_NAME_KEY);
      if (saved) setJudgeName(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const loadTeams = useCallback(async () => {
    setTeamsLoading(true);
    try {
      const [t, e] = await Promise.all([
        apiGet<{ success: boolean; data: Team[] }>('/teams'),
        apiGet<{ success: boolean; data: EventDto }>('/event').catch(() => null)
      ]);
      setTeams(t.data);
      if (e?.data?.eventName) setEventName(e.data.eventName);
    } catch {
      setError('Could not load teams.');
    } finally {
      setTeamsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTeams();
  }, [loadTeams]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!teamId) {
      setError('Please select a team');
      return;
    }

    const jn = judgeName.trim();
    if (!jn) {
      setError('Enter your name as judge.');
      return;
    }

    const ideaClarityScore = parse1to10(scores.idea);
    const technicalExecutionScore = parse1to10(scores.technical);
    const businessValueScore = parse1to10(scores.business);
    const presentationScore = parse1to10(scores.presentation);
    const teamworkScore = parse1to10(scores.teamwork);

    if (
      ideaClarityScore === null ||
      technicalExecutionScore === null ||
      businessValueScore === null ||
      presentationScore === null ||
      teamworkScore === null
    ) {
      setError('Score must be between 1 and 10');
      return;
    }

    setSubmitting(true);
    try {
      await apiPostJson<{ success: boolean; message?: string }>('/scores', {
        teamId,
        judgeName: jn,
        ideaClarityScore,
        technicalExecutionScore,
        businessValueScore,
        presentationScore,
        teamworkScore,
        comments: comments.trim() || null
      });
      try {
        localStorage.setItem(JUDGE_NAME_KEY, jn);
      } catch {
        /* ignore */
      }
      setSuccess('Score submitted successfully');
      setScores({ ...emptyScores });
      setComments('');
      setTeamId('');
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError('Could not submit score.');
    } finally {
      setSubmitting(false);
    }
  }

  const noTeams = !teamsLoading && teams.length === 0;

  return (
    <div>
      <div className="mx-auto max-w-2xl px-4 pt-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">{eventName}</p>
        <h1 className="text-2xl font-bold text-brand-900 sm:text-3xl">Score Teams</h1>
        <p className="mt-1 text-sm text-slate-600">Judges only. Your name is saved on this device.</p>
      </div>

      <div className="mx-auto max-w-2xl px-4 pb-10 pt-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
          {noTeams && (
            <div className="mb-6 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              No teams available yet
            </div>
          )}

          <form className="space-y-5" onSubmit={onSubmit}>
            <label className="block text-sm font-medium text-slate-700">
              Judge name
              <input
                value={judgeName}
                onChange={(e) => setJudgeName(e.target.value)}
                placeholder="Your name"
                disabled={noTeams}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-500/30 focus:ring-4 disabled:bg-slate-50"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Team
              <select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                disabled={noTeams || teamsLoading}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand-500/30 focus:ring-4 disabled:bg-slate-50"
              >
                <option value="">Select a team…</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.teamName} ({t.memberCount} members)
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              {(
                [
                  ['idea', 'Idea clarity', scores.idea],
                  ['technical', 'Technical execution', scores.technical],
                  ['business', 'Business value', scores.business],
                  ['presentation', 'Presentation', scores.presentation],
                  ['teamwork', 'Teamwork', scores.teamwork]
                ] as const
              ).map(([key, label, val]) => (
                <label key={key} className="block text-sm font-medium text-slate-700">
                  {label} (1–10)
                  <input
                    type="number"
                    min={1}
                    max={10}
                    step={1}
                    value={val}
                    onChange={(e) =>
                      setScores((s) => ({ ...s, [key]: e.target.value }))
                    }
                    disabled={noTeams}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-500/30 focus:ring-4 disabled:bg-slate-50"
                  />
                </label>
              ))}
            </div>

            <label className="block text-sm font-medium text-slate-700">
              Comments (optional)
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
                disabled={noTeams}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-500/30 focus:ring-4 disabled:bg-slate-50"
              />
            </label>

            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={noTeams || submitting || teamsLoading}
              className="w-full rounded-2xl bg-brand-900 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit Score'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
