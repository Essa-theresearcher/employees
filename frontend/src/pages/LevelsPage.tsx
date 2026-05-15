import { useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getAdminToken } from '../lib/auth';
import { useEventPhase } from '../lib/useEventPhase';

type LevelKey = 'registration' | 'teams' | 'qa' | 'polls' | 'leaderboard' | 'certificates';

type LevelDef = {
  key: LevelKey;
  level: number;
  title: string;
  lockedStatus: string;
  unlockedHref?: string;
  unlockedLabel?: string;
};

const LEVELS: LevelDef[] = [
  {
    key: 'registration',
    level: 1,
    title: 'Registration',
    lockedStatus: 'Open Now',
    unlockedHref: '/register',
    unlockedLabel: 'Register Now'
  },
  {
    key: 'teams',
    level: 2,
    title: 'Team Formation',
    lockedStatus: 'Opens when the event portal goes live',
    unlockedHref: '/teams',
    unlockedLabel: 'Enter teams'
  },
  {
    key: 'qa',
    level: 3,
    title: 'Live Q&A',
    lockedStatus: 'Opens when the event portal goes live',
    unlockedHref: '/qa',
    unlockedLabel: 'Open Q&A'
  },
  {
    key: 'polls',
    level: 4,
    title: 'Polls',
    lockedStatus: 'Opens when the event portal goes live',
    unlockedHref: '/polls',
    unlockedLabel: 'Open polls'
  },
  {
    key: 'leaderboard',
    level: 5,
    title: 'Leaderboard',
    lockedStatus: 'Opens when the event portal goes live',
    unlockedHref: '/leaderboard',
    unlockedLabel: 'Open leaderboard'
  },
  {
    key: 'certificates',
    level: 6,
    title: 'Certificates',
    lockedStatus: 'Opens when the event portal goes live',
    unlockedHref: '/certificates',
    unlockedLabel: 'Certificates'
  }
];

function LockGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
      />
    </svg>
  );
}

export function LevelsPage() {
  const [searchParams] = useSearchParams();
  const highlight = (searchParams.get('highlight') ?? '').toLowerCase();
  const { phase } = useEventPhase();
  const unlocked = Boolean(getAdminToken()) || Boolean(phase?.portalOpen);
  const cardRefs = useRef<Partial<Record<LevelKey, HTMLDivElement | null>>>({});

  const highlightKey = useMemo((): LevelKey | null => {
    const allowed: LevelKey[] = ['registration', 'teams', 'qa', 'polls', 'leaderboard', 'certificates'];
    return allowed.includes(highlight as LevelKey) ? (highlight as LevelKey) : null;
  }, [highlight]);

  useEffect(() => {
    if (!highlightKey) return;
    const el = cardRefs.current[highlightKey];
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightKey]);

  return (
    <div className="relative overflow-hidden pb-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(30,58,138,0.12),_transparent_55%)]" />

      <div className="relative mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-700">Progress map</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">Coffee and Code Event Levels</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600">
            Follow the journey from registration to certificates. Explore each level as it opens during the event.
          </p>
        </div>

        <ul className="relative mx-auto mt-12 max-w-xl space-y-0">
          {LEVELS.map((def, i) => {
            const isRegistration = def.key === 'registration';
            const isActiveCard = isRegistration || unlocked;
            const isLockedCard = !isRegistration && !unlocked;
            const isHighlighted = highlightKey === def.key;
            const isLast = i === LEVELS.length - 1;

            return (
              <li key={def.key} className="flex gap-0">
                <div className="flex w-14 shrink-0 flex-col items-center pt-1 sm:w-16">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white bg-brand-900 text-sm font-bold text-white shadow-md ring-2 ring-brand-200 sm:h-12 sm:w-12">
                    {def.level}
                  </div>
                  {!isLast && (
                    <div
                      className="my-1 w-0 flex-1 min-h-[1.5rem] border-l-2 border-dashed border-coffee-200 sm:min-h-[2rem]"
                      aria-hidden
                    />
                  )}
                </div>

                <div className={`min-w-0 flex-1 pb-10 pl-2 sm:pl-4 ${i % 2 === 1 ? 'sm:translate-x-4 md:translate-x-8' : ''}`}>
                  <div
                    ref={(node) => {
                      cardRefs.current[def.key] = node;
                    }}
                    className={[
                      'rounded-3xl border p-5 shadow-sm transition sm:p-6',
                      isActiveCard
                        ? 'border-brand-200 bg-white/95 shadow-soft'
                        : 'border-slate-200/90 bg-slate-50/95 text-slate-600',
                      isHighlighted ? 'ring-4 ring-brand-400/40 ring-offset-2 ring-offset-brand-50' : ''
                    ].join(' ')}
                  >
                    <p className="text-[11px] font-bold uppercase tracking-wider text-brand-800/90">Level {def.level}</p>
                    <h2 className="mt-1 text-lg font-bold text-brand-900 sm:text-xl">{def.title}</h2>
                    <p
                      className={`mt-2 text-xs font-semibold uppercase tracking-wide ${
                        isRegistration || unlocked ? 'text-emerald-700' : 'text-slate-500'
                      }`}
                    >
                      {isRegistration ? 'Open Now' : unlocked ? 'Open now' : def.lockedStatus}
                    </p>

                    {isLockedCard && (
                      <div className="mt-4 rounded-2xl border border-slate-200/90 bg-white/70 px-4 py-3">
                        <div className="flex items-center gap-2 text-slate-500">
                          <LockGlyph className="h-6 w-6 shrink-0" />
                          <span className="text-sm font-semibold text-slate-600">Locked</span>
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-slate-500">
                          Organizers will open the portal when teams are ready. Registration is always available.
                        </p>
                      </div>
                    )}

                    <div className="mt-5">
                      {isRegistration ? (
                        <Link
                          to="/register"
                          className="inline-flex w-full justify-center rounded-2xl bg-brand-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 sm:w-auto"
                        >
                          Register Now
                        </Link>
                      ) : unlocked && def.unlockedHref ? (
                        <Link
                          to={def.unlockedHref}
                          className="inline-flex w-full justify-center rounded-2xl bg-brand-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 sm:w-auto"
                        >
                          {def.unlockedLabel ?? 'Open'}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="inline-flex w-full cursor-not-allowed justify-center rounded-2xl border border-slate-200 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-400 sm:w-auto"
                        >
                          Locked
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mx-auto mt-4 max-w-lg rounded-3xl border border-brand-200 bg-gradient-to-br from-white to-brand-50 p-8 text-center shadow-soft">
          {unlocked ? (
            <p className="text-base font-semibold text-brand-900">The event portal is live — explore the modules above.</p>
          ) : (
            <>
              <p className="text-base font-semibold text-brand-900">Registration is open now.</p>
              <p className="mt-3 text-sm text-slate-600">
                Teams, live Q&amp;A, polls, and the leaderboard unlock for everyone once organizers publish teams.
              </p>
              <Link
                to="/register"
                className="mt-5 inline-flex justify-center rounded-2xl bg-brand-900 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-brand-700"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
