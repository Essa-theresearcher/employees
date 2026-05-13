import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getAdminToken } from '../lib/auth';
import { isPublicEventModulesUnlocked } from '../lib/eventModules';
import { pathToLevelsHighlight } from '../lib/levelsRouting';

/** Non-admin users need a check-in session (see `syncCheckedInEventAccessFromStatus`). */

export function PublicEventModuleGate() {
  const adminToken = getAdminToken();
  const { pathname } = useLocation();

  if (adminToken || isPublicEventModulesUnlocked()) {
    return <Outlet />;
  }

  const highlight = pathToLevelsHighlight(pathname);
  return <Navigate to={{ pathname: '/levels', search: `?highlight=${encodeURIComponent(highlight)}` }} replace />;
}
