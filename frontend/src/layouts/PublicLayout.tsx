import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/register', label: 'Register' },
  { to: '/contact', label: 'Contact' },
  { to: '/levels', label: 'Event levels' }
] as const;

const WHATSAPP_URL =
  (import.meta.env.VITE_WHATSAPP_URL as string | undefined) ||
  'https://wa.me/254700000000';

function linkClass(isActive: boolean): string {
  return [
    'rounded-2xl px-3 py-2 text-sm font-semibold transition',
    isActive
      ? 'bg-brand-900 text-white'
      : 'text-slate-700 hover:bg-slate-100 hover:text-brand-900'
  ].join(' ');
}

export function PublicLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-full bg-gradient-to-b from-brand-50 via-white to-coffee-50">
      <header className="sticky top-0 z-30 border-b border-white/60 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <span className="rounded-2xl bg-brand-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
              Attendee
            </span>
            <span className="text-base font-bold text-brand-900 sm:text-lg">Coffee &amp; Code</span>
          </Link>

          <nav className="hidden flex-wrap items-center gap-1 md:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => linkClass(isActive)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
            >
              WhatsApp
            </a>
            <Link
              to="/register"
              className="rounded-2xl bg-brand-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
            >
              Register
            </Link>
          </div>

          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 md:hidden"
          >
            {open ? 'Close' : 'Menu'}
          </button>
        </div>

        {open && (
          <div className="border-t border-slate-100 bg-white md:hidden">
            <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) => linkClass(isActive)}
                >
                  {item.label}
                </NavLink>
              ))}
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-sm font-semibold text-emerald-800"
              >
                WhatsApp
              </a>
              <Link
                to="/register"
                onClick={() => setOpen(false)}
                className="rounded-2xl bg-brand-900 px-3 py-2 text-center text-sm font-semibold text-white"
              >
                Register
              </Link>
            </nav>
          </div>
        )}
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
