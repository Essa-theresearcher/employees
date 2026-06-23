import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '../lib/api';
import { EVENT_UNLOCK_LABEL } from '../lib/eventDay';

type Phase = {
  portalOpen: boolean;
  checkInClosed: boolean;
  teamsPublished: boolean;
  teamCount: number;
};

const SPLASH_IMAGE = `${import.meta.env.BASE_URL}images/welcome-splash.png`;

export function WelcomeSplashPage() {
  const [phase, setPhase] = useState<Phase | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await apiGet<{ success: boolean; data: Phase }>('/event');
        if (!cancelled) setPhase(res.data);
      } catch {
        /* keep showing splash */
      }
    }

    void poll();
    const handle = window.setInterval(poll, 20_000);
    return () => {
      cancelled = true;
      window.clearInterval(handle);
    };
  }, []);

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden bg-[#0a1628] px-6 py-16 text-white">
      <img
        src={SPLASH_IMAGE}
        alt="Coffee and Code — Build. Connect. Grow. Nairobi Tech Builders Session"
        className="relative z-10 w-full max-w-2xl object-contain"
      />
      {phase && !phase.portalOpen ? (
        <div className="relative z-10 mt-10 max-w-md space-y-3 rounded-2xl border border-white/15 bg-black/40 px-6 py-5 text-sm text-white/85 backdrop-blur-sm">
          <p className="font-semibold text-white">The event portal opens soon</p>
          <ul className="space-y-1 text-left text-xs sm:text-sm">
            <li className="text-white/70">○ Event levels unlock on {EVENT_UNLOCK_LABEL}</li>
            <li className={phase.teamsPublished ? 'text-emerald-300' : 'text-white/70'}>
              {phase.teamsPublished ? '\u2713' : '\u25cb'} Organizers publish teams (or open the portal in admin)
              {!phase.teamsPublished && phase.teamCount === 0 ? ' (waiting)' : ''}
            </li>
          </ul>
          <p className="text-xs text-white/60">
            This page refreshes automatically.             You can still{' '}
            <Link to="/register" className="font-semibold text-white underline">
              register here
            </Link>
            . Already registered? Scan your badge QR.
          </p>
        </div>
      ) : null}
    </div>
  );
}
