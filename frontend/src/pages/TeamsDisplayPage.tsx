import { useCallback, useEffect, useState } from 'react';
import { apiGet } from '../lib/api';

const MAX_TEAM_SIZE = 5;
const REFRESH_MS = 5000;

type TeamMember = {
  id: string;
  attendeeId: string;
  fullName: string;
  roleInTeam: string | null;
};

type Team = {
  id: string;
  teamName: string;
  description: string | null;
  memberCount: number;
  members: TeamMember[];
};

type EventDto = {
  eventName: string;
};

export function TeamsDisplayPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [eventName, setEventName] = useState('Coffee & Code');
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      const [t, e] = await Promise.all([
        apiGet<{ success: boolean; data: Team[] }>('/teams'),
        apiGet<{ success: boolean; data: EventDto }>('/event').catch(() => null)
      ]);
      setTeams(t.data);
      if (e?.data?.eventName) setEventName(e.data.eventName);
      setError(null);
      setLastUpdated(new Date());
    } catch {
      setError('Lost connection to the API. Retrying…');
    }
  }, []);

  useEffect(() => {
    void load();
    const handle = window.setInterval(load, REFRESH_MS);
    return () => window.clearInterval(handle);
  }, [load]);

  const totalAssigned = teams.reduce((sum, t) => sum + t.memberCount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-700 to-coffee-700 text-white">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col gap-10 px-10 py-10">
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-amber-200">
              {eventName}
            </p>
            <h1 className="mt-2 text-6xl font-bold tracking-tight">Team Formation Board</h1>
            <p className="mt-3 text-lg text-white/70">
              Live roster · refreshes every {REFRESH_MS / 1000} seconds
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-right">
            <Stat label="Teams" value={teams.length} />
            <Stat label="Builders on teams" value={totalAssigned} />
            <Stat label="Slots open" value={Math.max(0, teams.length * MAX_TEAM_SIZE - totalAssigned)} />
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-amber-300/40 bg-amber-300/10 px-5 py-3 text-sm text-amber-100">
            {error}
          </div>
        )}

        {teams.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-3xl border border-white/20 bg-white/5 p-16 text-center">
            <p className="text-2xl font-medium text-white/80">No teams yet — create the first one!</p>
          </div>
        ) : (
          <div className="grid flex-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {teams.map((t) => {
              const full = t.memberCount >= MAX_TEAM_SIZE;
              return (
                <article
                  key={t.id}
                  className="flex flex-col gap-4 rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-3xl font-bold">{t.teamName}</h3>
                    <span
                      className={`rounded-full px-4 py-1 text-sm font-semibold ${
                        full ? 'bg-red-400/30 text-red-100' : 'bg-emerald-400/30 text-emerald-100'
                      }`}
                    >
                      {t.memberCount}/{MAX_TEAM_SIZE}
                    </span>
                  </div>
                  {t.description && (
                    <p className="text-base text-white/75">{t.description}</p>
                  )}
                  <ul className="mt-2 space-y-2 text-lg">
                    {t.members.length === 0 && (
                      <li className="italic text-white/60">Looking for builders…</li>
                    )}
                    {t.members.map((m) => (
                      <li key={m.id} className="rounded-2xl bg-white/10 px-4 py-3">
                        <p className="font-semibold">{m.fullName}</p>
                        <p className="text-sm text-white/70">
                          <span className="font-mono">{m.attendeeId}</span>
                          {m.roleInTeam ? ` · ${m.roleInTeam}` : ''}
                        </p>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        )}

        <footer className="mt-auto text-xs uppercase tracking-[0.32em] text-white/40">
          {lastUpdated && <>Last updated {lastUpdated.toLocaleTimeString()}</>}
        </footer>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-left">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
    </div>
  );
}
