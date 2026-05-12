import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getAdminToken } from '../lib/auth';

/**
 * Kept for backward compatibility.
 * New code should use `<AdminAuthGate />` together with `<AdminLayout />`.
 * This component renders an Outlet behind an admin auth check.
 */
export function RequireAdmin() {
  const location = useLocation();
  const token = getAdminToken();

  if (!token) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
