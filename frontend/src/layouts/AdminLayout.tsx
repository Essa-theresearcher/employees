import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { clearAdminToken } from '../lib/auth';

const ADMIN_NAV = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/registrations', label: 'Registrations' },
  { to: '/admin/payments', label: 'Payments' },
  { to: '/admin/check-in', label: 'Check-In' },
  { to: '/admin/teams', label: 'Teams' },
  { to: '/admin/judging', label: 'Judging' },
  { to: '/admin/leaderboard', label: 'Leaderboard' },
  { to: '/admin/certificates', label: 'Certificates' },
  { to: '/admin/qa', label: 'Q&A' },
  { to: '/admin/polls', label: 'Polls' },
  { to: '/admin/settings', label: 'Settings' }
];

function linkClass(isActive: boolean): string {
  return [
    'block rounded-xl px-3 py-2 text-sm font-semibold transition',
    isActive
      ? 'bg-brand-900 text-white shadow-sm'
      : 'text-slate-700 hover:bg-slate-100 hover:text-brand-900'
  ].join(' ');
}

export function AdminLayout() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  function logout() {
    clearAdminToken();
    navigate('/admin/login', { replace: true });
  }

  return (
    <div className="min-h-full bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Toggle navigation"
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 lg:hidden"
            >
              {open ? 'Close' : 'Menu'}
            </button>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-700">Admin Control Room</p>
              <p className="text-sm font-bold text-slate-900">Coffee &amp; Code</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="hidden rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 sm:inline-flex"
            >
              Public site
            </Link>
            <button
              type="button"
              onClick={logout}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        <aside
          className={[
            'fixed inset-y-0 left-0 z-20 w-64 transform border-r border-slate-200 bg-white p-4 pt-20 transition-transform lg:static lg:z-auto lg:block lg:w-60 lg:translate-x-0 lg:border-0 lg:bg-transparent lg:p-0',
            open ? 'translate-x-0 shadow-xl' : '-translate-x-full lg:shadow-none'
          ].join(' ')}
        >
          <nav className="flex flex-col gap-1">
            {ADMIN_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) => linkClass(isActive)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {open && (
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-10 bg-slate-900/30 lg:hidden"
            onClick={() => setOpen(false)}
          />
        )}

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
