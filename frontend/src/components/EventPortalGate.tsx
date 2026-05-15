import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { WelcomeSplashPage } from '../pages/WelcomeSplashPage';
import { getAdminToken } from '../lib/auth';
import { useEventPhase } from '../lib/useEventPhase';

function isAlwaysPublicPath(pathname: string, search: string): boolean {
  if (pathname === '/register' || pathname === '/thanks' || pathname === '/contact' || pathname === '/levels') {
    return true;
  }
  const id = new URLSearchParams(search).get('id')?.trim();
  if (id && (pathname === '/register' || pathname === '/')) return true;
  if (pathname.startsWith('/verify')) return true;
  return false;
}

/** Welcome splash until organizers publish teams; registration is always reachable. */
export function EventPortalGate() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const { phase, loading } = useEventPhase();

  const adminToken = getAdminToken();
  const alwaysPublic = isAlwaysPublicPath(pathname, search);
  const portalOpen = Boolean(phase?.portalOpen);
  const allowThrough = Boolean(adminToken || alwaysPublic || portalOpen);

  useEffect(() => {
    if (portalOpen && pathname === '/') {
      navigate('/register', { replace: true });
    }
  }, [navigate, pathname, portalOpen]);

  if (allowThrough) {
    return <Outlet />;
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#0a1628]">
        <p className="text-sm text-white/70">Loading…</p>
      </div>
    );
  }

  return <WelcomeSplashPage />;
}
