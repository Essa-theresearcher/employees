/** Maps a locked-module URL path to a `/levels?highlight=` value. */
export function pathToLevelsHighlight(pathname: string): string {
  const p = pathname.replace(/\/$/, '') || '/';
  if (p === '/judge' || p.startsWith('/judge/')) return 'leaderboard';
  if (p.startsWith('/display/leaderboard')) return 'leaderboard';
  if (p.startsWith('/display/teams')) return 'teams';
  if (p.startsWith('/display/qa')) return 'qa';
  if (p.startsWith('/display/polls')) return 'polls';
  if (p === '/teams' || p.startsWith('/teams/')) return 'teams';
  if (p === '/leaderboard' || p.startsWith('/leaderboard/')) return 'leaderboard';
  if (p === '/qa' || p.startsWith('/qa/')) return 'qa';
  if (p === '/polls' || p.startsWith('/polls/')) return 'polls';
  if (p === '/certificates' || p.startsWith('/certificates/')) return 'certificates';
  return 'teams';
}
