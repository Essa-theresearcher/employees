import { Link } from 'react-router-dom';

const DISPLAYS: { to: string; title: string; description: string }[] = [
  {
    to: '/display/teams',
    title: 'Teams',
    description: 'Live team roster and member counts for the room.'
  },
  {
    to: '/display/qa',
    title: 'Q&A',
    description: 'Questions and upvotes on the big screen.'
  },
  {
    to: '/display/polls',
    title: 'Polls',
    description: 'Active poll results as they come in.'
  },
  {
    to: '/display/leaderboard',
    title: 'Leaderboard',
    description: 'Judging scores and rankings.'
  }
];

export function ProjectorHubPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center gap-10 px-8 py-12">
      <header className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">Venue display</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">Projector</h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-slate-300">
          These pages are read-only live views for the hall. They do not include admin tools — use your own laptop for
          check-in, payments, and settings.
        </p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2">
        {DISPLAYS.map((d) => (
          <li key={d.to}>
            <Link
              to={d.to}
              className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/5 px-6 py-6 text-left shadow-lg transition hover:border-amber-300/40 hover:bg-white/10"
            >
              <span className="text-xl font-bold text-white">{d.title}</span>
              <span className="mt-2 text-sm text-slate-300">{d.description}</span>
              <span className="mt-4 text-sm font-semibold text-amber-200">Open full screen →</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
