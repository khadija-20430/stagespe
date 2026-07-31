import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

const cn = (...c) => c.filter(Boolean).join(' ');

const consultation = [
  { to: '/cooperation', label: 'Coopération internationale' },
  { to: '/projets', label: 'Projets' },
  { to: '/appels', label: 'Appels à projets' },
  { to: '/mobilites', label: 'Mobilités' },
];

const ressources = [
  { to: '/actualites', label: 'Actualités & événements' },
  { to: '/documents', label: 'Bibliothèque de documents' },
];

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="Accueil ESI">
      <span
        translate="no"
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-cobalt text-sm font-extrabold text-white"
      >
        ESI
      </span>
      <span className="hidden flex-col leading-tight sm:flex">
        <span className="text-sm font-bold text-navy">Coopération</span>
        <span className="text-xs font-medium text-slate-500">Internationale</span>
      </span>
    </Link>
  );
}

function Dropdown({ label, items, pathname }) {
  const [open, setOpen] = useState(false);
  const isActive = items.some((i) => pathname.startsWith(i.to));
  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          'flex min-h-[44px] items-center gap-1 px-3 text-sm font-medium transition-colors',
          isActive ? 'text-cobalt' : 'text-slate-700 hover:text-cobalt'
        )}
      >
        <span>{label}</span>
        <svg
          className={cn('h-4 w-4 transition-transform', open && 'rotate-180')}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-30 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-card-hover">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive: a }) =>
                cn(
                  'block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  a ? 'bg-blue-50 text-cobalt' : 'text-slate-700 hover:bg-slate-50'
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function Navbar() {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const allLinks = [...consultation, ...ressources];

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Logo />

        <div className="hidden items-center gap-1 lg:flex">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn(
                'flex min-h-[44px] items-center px-3 text-sm font-medium transition-colors',
                isActive ? 'text-cobalt' : 'text-slate-700 hover:text-cobalt'
              )
            }
          >
            Accueil
          </NavLink>
          <Dropdown label="Consultation" items={consultation} pathname={pathname} />
          <Dropdown label="Ressources" items={ressources} pathname={pathname} />
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <Link
            to="/admin"
            className="inline-flex min-h-[44px] items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-navy transition-colors hover:border-cobalt hover:text-cobalt"
          >
            Espace admin
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-navy lg:hidden"
          aria-label="Menu"
          aria-expanded={mobileOpen}
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
          <NavLink
            to="/"
            end
            onClick={() => setMobileOpen(false)}
            className="block rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Accueil
          </NavLink>
          {allLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  'block rounded-lg px-3 py-3 text-sm font-medium',
                  isActive ? 'bg-blue-50 text-cobalt' : 'text-slate-700 hover:bg-slate-50'
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
          <Link
            to="/admin"
            onClick={() => setMobileOpen(false)}
            className="mt-2 block rounded-lg bg-navy px-3 py-3 text-center text-sm font-semibold text-white"
          >
            Espace admin
          </Link>
        </div>
      ) : null}
    </nav>
  );
}
