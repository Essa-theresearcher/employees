import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { WelcomeSplashPage } from '../pages/WelcomeSplashPage';
import { apiGet } from '../lib/api';
import { getAdminToken } from '../lib/auth';

type Phase = {
  portalOpen: boolean;
};

function isExemptPath(pathname: string, search: string): boolean {
  const id = new URLSearchParams(search).get('id')?.trim();
  if (id && (pathname === '/register' || pathname === '/')) return true;
  if (pathname.startsWith('/verify')) return true;
  return false;
}

/** Shows welcome splash until check-in is closed and organizers have published teams. */
export function EventPortalGate() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const [portalOpen, setPortalOpen] = useState<boolean | null>(null);

  const adminToken = getAdminToken();
  const exempt = isExemptPath(pathname, search);

  useEffect(() => {
    if (adminToken || exempt) {
      setPortalOpen(true);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const res = await apiGet<{ success: boolean; data: Phase }>('/event');
        if (!cancelled) {
          setPortalOpen(res.data.portalOpen);
          if (res.data.portalOpen && pathname === '/') {
            navigate('/register', { replace: true });
          }
        }
      } catch {
        if (!cancelled) setPortalOpen(false);
      }
    }

    void load();
    const handle = window.setInterval(() => void load(), 20_000);
    return () => {
      cancelled = true;
      window.clearInterval(handle);
    };
  }, [adminToken, exempt, navigate, pathname]);

  if (adminToken || exempt) {
    return <Outlet />;
  }

  if (portalOpen === null) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#0a1628]">
        <p className="text-sm text-white/70">Loading…</p>
      </div>
    );
  }

  if (!portalOpen) {
    return <WelcomeSplashPage />;
  }

  return <Outlet />;
}
