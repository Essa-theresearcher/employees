import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiDelete, apiGet, apiPostJson, ApiError } from '../../lib/api';
import { clearAdminToken, getAdminToken } from '../../lib/auth';

const MAX_TEAM_SIZE = 5;

type TeamMember = {
  id: string;
  attendeeId: string;
  fullName: string;
  roleInTeam: string | null;
  skills: string | null;
  joinedAt: string;
};

type Team = {
  id: string;
  teamName: string;
  description: string | null;
  createdAt: string;
  memberCount: number;
  members: TeamMember[];
};

type TeamMetrics = {
  totalTeams: number;
  checkedInAttendees: number;
  attendeesInTeams: number;
  attendeesWithoutTeams: number;
};

type Banner = { kind: 'success' | 'error'; text: string } | null;

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function AdminTeams() {
  const navigate = useNavigate();
  const token = getAdminToken()!;

  const [teams, setTeams] = useState<Team[]>([]);
  const [metrics, setMetrics] = useState<TeamMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<Banner>(null);
  const [loading, setLoading] = useState(true);

  const [teamName, setTeamName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const [busyMember, setBusyMember] = useState<string | null>(null);
  const [busyTeam, setBusyTeam] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [m, t] = await Promise.all([
        apiGet<{ success: boolean; data: TeamMetrics }>('/admin/teams/metrics', token),
        apiGet<{ success: boolean; data: Team[] }>('/admin/teams', token)
      ]);
      setMetrics(m.data);
      setTeams(t.data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearAdminToken();
        navigate('/admin/login', { replace: true });
        return;
      }
      setError('Could not load teams.');
    } finally {
      setLoading(false);
    }
  }, [navigate, token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setBanner(null);
    try {
      await apiPostJson<{ success: boolean }>(
        '/admin/teams',
        { teamName: teamName.trim(), description: description.trim() || null },
        token
      );
      setBanner({ kind: 'success', text: 'Team created successfully' });
      setTeamName('');
      setDescription('');
      await load();
    } catch (err) {
      if (err instanceof ApiError) setBanner({ kind: 'error', text: err.message });
      else setBanner({ kind: 'error', text: 'Could not create team.' });
    } finally {
      setCreating(false);
    }
  }

  async function onRemoveMember(member: TeamMember) {
    if (!window.confirm(`Remove ${member.fullName} from the team?`)) return;
    setBusyMember(member.id);
    setBanner(null);
    try {
      await apiDelete(`/admin/teams/members/${encodeURIComponent(member.id)}`, token);
      setBanner({ kind: 'success', text: `${member.fullName} removed.` });
      await load();
    } catch (err) {
      if (err instanceof ApiError) setBanner({ kind: 'error', text: err.message });
      else setBanner({ kind: 'error', text: 'Could not remove member.' });
    } finally {
      setBusyMember(null);
    }
  }

  async function onDeleteTeam(team: Team) {
    if (team.memberCount > 0) {
      setBanner({ kind: 'error', text: 'Only empty teams can be deleted. Remove members first.' });
      return;
    }
    if (!window.confirm(`Delete team "${team.teamName}"?`)) return;
    setBusyTeam(team.id);
    setBanner(null);
    try {
      await apiDelete(`/admin/teams/${encodeURIComponent(team.id)}`, token);
      setBanner({ kind: 'success', text: `Team ${team.teamName} deleted.` });
      await load();
    } catch (err) {
      if (err instanceof ApiError) setBanner({ kind: 'error', text: err.message });
      else setBanner({ kind: 'error', text: 'Could not delete team.' });
    } finally {
      setBusyTeam(null);
    }
  }

  const cards = metrics
    ? [
        { label: 'Total teams', value: metrics.totalTeams },
        { label: 'Checked-in attendees', value: metrics.checkedInAttendees },
        { label: 'Assigned to teams', value: metrics.attendeesInTeams },
        { label: 'Without a team', value: metrics.attendeesWithoutTeams }
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-brand-900">Team Formation</h1>
        <p className="mt-1 text-sm text-slate-600">
          Create teams, remove members, and clean up empty teams.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{c.label}</p>
            <p className="mt-3 text-2xl font-bold text-brand-900">{c.value}</p>
          </div>
        ))}
        {loading && !metrics && (
          <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
            Loading metrics…
          </div>
        )}
      </div>

      {banner && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            banner.kind === 'success'
              ? 'border-emerald-100 bg-emerald-50 text-emerald-800'
              : 'border-red-100 bg-red-50 text-red-700'
          }`}
        >
          {banner.text}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-brand-900">Create team</h2>
        <p className="mt-1 text-sm text-slate-600">Up to {MAX_TEAM_SIZE} members per team. Names must be unique.</p>
        <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={onCreate}>
          <label className="block text-sm font-medium text-slate-700">
            Team name
            <input
              required
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-500/30 focus:ring-4"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Description (optional)
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-500/30 focus:ring-4"
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={creating}
              className="rounded-2xl bg-brand-900 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {creating ? 'Creating…' : 'Create team'}
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-brand-900">Teams</h2>
        </header>

        {teams.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-slate-500">No teams yet.</div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3">Team name</th>
                <th className="px-6 py-3">Members</th>
                <th className="px-6 py-3">Count</th>
                <th className="px-6 py-3">Created</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teams.map((t) => (
                <tr key={t.id}>
                  <td className="px-6 py-4 align-top">
                    <p className="font-semibold text-slate-900">{t.teamName}</p>
                    {t.description && <p className="text-xs text-slate-500">{t.description}</p>}
                  </td>
                  <td className="px-6 py-4 align-top">
                    {t.members.length === 0 && <span className="text-xs italic text-slate-500">No members</span>}
                    <ul className="space-y-1">
                      {t.members.map((m) => (
                        <li
                          key={m.id}
                          className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 px-3 py-2"
                        >
                          <span className="font-semibold text-slate-900">{m.fullName}</span>
                          <span className="font-mono text-xs text-slate-500">{m.attendeeId}</span>
                          {m.roleInTeam && (
                            <span className="rounded-full bg-coffee-100 px-2 py-0.5 text-xs font-medium text-coffee-800">
                              {m.roleInTeam}
                            </span>
                          )}
                          <button
                            type="button"
                            disabled={busyMember === m.id}
                            onClick={() => void onRemoveMember(m)}
                            className="ml-auto rounded-lg border border-red-100 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                          >
                            {busyMember === m.id ? 'Removing…' : 'Remove'}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        t.memberCount >= MAX_TEAM_SIZE
                          ? 'bg-red-50 text-red-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {t.memberCount}/{MAX_TEAM_SIZE}
                    </span>
                  </td>
                  <td className="px-6 py-4 align-top text-xs text-slate-600">
                    {formatDateTime(t.createdAt)}
                  </td>
                  <td className="px-6 py-4 align-top text-right">
                    <button
                      type="button"
                      onClick={() => void onDeleteTeam(t)}
                      disabled={busyTeam === t.id || t.memberCount > 0}
                      title={t.memberCount > 0 ? 'Only empty teams can be deleted.' : 'Delete team'}
                      className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {busyTeam === t.id ? 'Deleting…' : 'Delete team'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
