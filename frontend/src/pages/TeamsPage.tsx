import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { apiGet, apiPostJson, ApiError } from '../lib/api';

const MAX_TEAM_SIZE = 5;

type TeamMember = {
  id: string;
  attendeeId: string;
  fullName: string;
  roleInTeam: string | null;
  skills: string | null;
};

type Team = {
  id: string;
  teamName: string;
  description: string | null;
  createdAt: string;
  memberCount: number;
  members: TeamMember[];
};

type Banner = { kind: 'success' | 'error'; text: string } | null;

export function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [teamName, setTeamName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [createBanner, setCreateBanner] = useState<Banner>(null);

  const [joinTarget, setJoinTarget] = useState<Team | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await apiGet<{ success: boolean; data: Team[] }>('/teams');
      setTeams(res.data);
      setLoadError(null);
    } catch {
      setLoadError('Could not load teams. Try again shortly.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const handle = window.setInterval(() => void load(true), 15000);
    return () => window.clearInterval(handle);
  }, [load]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateBanner(null);
    try {
      await apiPostJson<{ success: boolean; data: Team; message?: string }>(
        '/teams',
        { teamName: teamName.trim(), description: description.trim() || null }
      );
      setCreateBanner({ kind: 'success', text: 'Team created successfully' });
      setTeamName('');
      setDescription('');
      await load(true);
    } catch (err) {
      if (err instanceof ApiError) setCreateBanner({ kind: 'error', text: err.message });
      else setCreateBanner({ kind: 'error', text: 'Could not create team.' });
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <div className="mx-auto max-w-6xl space-y-2 px-4 pt-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">Attendee Portal</p>
        <h1 className="text-2xl font-bold text-brand-900 sm:text-3xl">Team Formation Board</h1>
      </div>
      <div className="mx-auto max-w-6xl space-y-8 px-4 pb-10 pt-6">
        <section className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-soft backdrop-blur sm:p-8">
          <h2 className="text-lg font-semibold text-brand-900">Create a team</h2>
          <p className="mt-1 text-sm text-slate-600">
            Up to {MAX_TEAM_SIZE} checked-in attendees per team. Pick a unique name.
          </p>
          <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={onCreate}>
            <label className="block text-sm font-medium text-slate-700 sm:col-span-1">
              Team name
              <input
                required
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Latte Liners"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-500/30 focus:ring-4"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700 sm:col-span-1">
              Description (optional)
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What are you building?"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-500/30 focus:ring-4"
              />
            </label>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={creating}
                className="rounded-2xl bg-brand-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-900/15 hover:bg-brand-700 disabled:opacity-60"
              >
                {creating ? 'Creating…' : 'Create team'}
              </button>
            </div>
          </form>
          {createBanner && (
            <div
              className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
                createBanner.kind === 'success'
                  ? 'border-emerald-100 bg-emerald-50 text-emerald-800'
                  : 'border-red-100 bg-red-50 text-red-700'
              }`}
            >
              {createBanner.text}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-brand-900">Teams</h2>
            <p className="text-xs text-slate-500">{teams.length} team{teams.length === 1 ? '' : 's'}</p>
          </div>
          {loadError && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</div>
          )}
          {loading && <p className="text-sm text-slate-600">Loading teams…</p>}
          {!loading && !teams.length && (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white/60 p-10 text-center text-sm text-slate-600">
              No teams yet — be the first to create one.
            </div>
          )}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((t) => (
              <TeamCard key={t.id} team={t} onJoin={() => setJoinTarget(t)} />
            ))}
          </div>
        </section>
      </div>

      {joinTarget && (
        <JoinModal
          team={joinTarget}
          onClose={() => setJoinTarget(null)}
          onJoined={async () => {
            await load(true);
          }}
        />
      )}
    </div>
  );
}

function TeamCard({ team, onJoin }: { team: Team; onJoin: () => void }) {
  const full = team.memberCount >= MAX_TEAM_SIZE;
  return (
    <article className="flex flex-col gap-4 rounded-3xl border border-white/70 bg-white p-6 shadow-soft">
      <div>
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-brand-900">{team.teamName}</h3>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              full ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            {team.memberCount}/{MAX_TEAM_SIZE}
          </span>
        </div>
        {team.description && (
          <p className="mt-2 text-sm text-slate-600">{team.description}</p>
        )}
      </div>

      <ul className="space-y-2 text-sm">
        {team.members.length === 0 && (
          <li className="text-xs italic text-slate-500">No members yet.</li>
        )}
        {team.members.map((m) => (
          <li key={m.id} className="rounded-xl bg-slate-50 px-3 py-2">
            <p className="font-semibold text-slate-900">{m.fullName}</p>
            <p className="text-xs text-slate-500">
              <span className="font-mono">{m.attendeeId}</span>
              {m.roleInTeam ? ` · ${m.roleInTeam}` : ''}
            </p>
            {m.skills && <p className="mt-1 text-xs text-slate-600">{m.skills}</p>}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onJoin}
        disabled={full}
        className="mt-auto w-full rounded-2xl bg-brand-900 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {full ? 'Team full' : 'Join Team'}
      </button>
    </article>
  );
}

function JoinModal({
  team,
  onClose,
  onJoined
}: {
  team: Team;
  onClose: () => void;
  onJoined: () => Promise<void>;
}) {
  const [attendeeId, setAttendeeId] = useState('');
  const [skills, setSkills] = useState('');
  const [roleInTeam, setRoleInTeam] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!attendeeId.trim()) {
      setError('Enter your badge ID or phone number to continue.');
      return;
    }
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await apiPostJson<{ success: boolean; message?: string }>(
        `/teams/${encodeURIComponent(team.id)}/join`,
        {
          attendeeId: attendeeId.trim(),
          skills: skills.trim() || null,
          roleInTeam: roleInTeam.trim() || null
        }
      );
      setSuccess('Joined team successfully');
      await onJoined();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError('Could not join the team. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Join team</p>
            <h2 className="mt-1 text-xl font-bold text-brand-900">{team.teamName}</h2>
            <p className="text-sm text-slate-600">
              {team.memberCount}/{MAX_TEAM_SIZE} members
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <label className="block text-sm font-medium text-slate-700">
            Badge ID or phone number
            <input
              required
              value={attendeeId}
              onChange={(e) => setAttendeeId(e.target.value)}
              placeholder="e.g. CC-0001 or +254700…"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-500/30 focus:ring-4"
            />
            <span className="mt-1 block text-xs text-slate-500">
              You must already be checked in at the door to join.
            </span>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Preferred role (optional)
            <input
              value={roleInTeam}
              onChange={(e) => setRoleInTeam(e.target.value)}
              placeholder="e.g. Frontend, Designer"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-500/30 focus:ring-4"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Skills (optional)
            <input
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. React, Figma, Postgres"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-500/30 focus:ring-4"
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

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              {success ? 'Done' : 'Cancel'}
            </button>
            {!success && (
              <button
                type="submit"
                disabled={busy}
                className="rounded-2xl bg-brand-900 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {busy ? 'Joining…' : 'Join team'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
