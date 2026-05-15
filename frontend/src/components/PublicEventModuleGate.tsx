import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { apiGet } from '../lib/api';
import { getAdminToken } from '../lib/auth';
import {
  isPublicEventModulesUnlocked,
  refreshEventAccessFromServer
} from '../lib/eventModules';
import { pathToLevelsHighlight } from '../lib/levelsRouting';

/** Non-admin users need venue check-in on this device (see `syncCheckedInEventAccessFromStatus`). */

export function PublicEventModuleGate() {
  const adminToken = getAdminToken();
  const { pathname } = useLocation();
  const [unlocked, setUnlocked] = useState(() => Boolean(adminToken) || isPublicEventModulesUnlocked());
  const [syncing, setSyncing] = useState(
    () => !adminToken && !isPublicEventModulesUnlocked()
  );

  useEffect(() => {
    if (adminToken) {
      setUnlocked(true);
      setSyncing(false);
      return;
    }
    if (isPublicEventModulesUnlocked()) {
      setUnlocked(true);
      setSyncing(false);
      return;
    }

    let cancelled = false;
    setSyncing(true);

    void refreshEventAccessFromServer(async (registrationId) => {
      const res = await apiGet<{ success: boolean; data: { checkedIn: boolean } }>(
        `/registrations/${encodeURIComponent(registrationId)}/status`
      );
      return Boolean(res.data.checkedIn);
    }).then((ok) => {
      if (!cancelled) {
        setUnlocked(ok);
        setSyncing(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [adminToken]);

  if (syncing) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <p className="text-sm text-slate-600">Checking your check-in status…</p>
      </div>
    );
  }

  if (unlocked) {
    return <Outlet />;
  }

  const highlight = pathToLevelsHighlight(pathname);
  return <Navigate to={{ pathname: '/levels', search: `?highlight=${encodeURIComponent(highlight)}` }} replace />;
}
