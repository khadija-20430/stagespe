import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const cn = (...c) => c.filter(Boolean).join(' ');

function Logo() {
  const { t } = useTranslation();
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label={t('navbar.homeAria')}>
      <span
        translate="no"
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-cobalt text-sm font-extrabold text-white"
      >
        ESI
      </span>
      <span className="hidden flex-col leading-tight sm:flex">
        <span className="text-sm font-bold text-navy">{t('navbar.brandLine1')}</span>
        <span className="text-xs font-medium text-slate-500">{t('navbar.brandLine2')}</span>
      </span>
    </Link>
  );
}

function LanguageSwitcher({ className = '' }) {
  const { i18n } = useTranslation();
  return (
    <select
      value={i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      className={cn(
        'h-11 rounded-lg border border-slate-300 bg-white px-2 text-sm font-medium text-navy',
        className
      )}
      aria-label="Language"
    >
      <option value="fr">FR</option>
      <option value="en">EN</option>
      <option value="ar">AR</option>
    </select>
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
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const consultation = [
    { to: '/cooperation', label: t('navbar.cooperation') },
    { to: '/projets', label: t('navbar.projets') },
    { to: '/appels', label: t('navbar.appels') },
    { to: '/mobilites', label: t('navbar.mobilites') },
  ];

  const ressources = [
    { to: '/actualites', label: t('navbar.actualites') },
    { to: '/documents', label: t('navbar.documents') },
  ];

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
            {t('navbar.home')}
          </NavLink>
          <Dropdown label={t('navbar.consultationGroup')} items={consultation} pathname={pathname} />
          <Dropdown label={t('navbar.resourcesGroup')} items={ressources} pathname={pathname} />
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitcher />
          <Link
            to="/admin"
            className="inline-flex min-h-[44px] items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-navy transition-colors hover:border-cobalt hover:text-cobalt"
          >
            {t('navbar.admin')}
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <LanguageSwitcher className="h-9" />
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-navy"
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
      </div>

      {mobileOpen ? (
        <div className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
          <NavLink
            to="/"
            end
            onClick={() => setMobileOpen(false)}
            className="block rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {t('navbar.home')}
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
            {t('navbar.admin')}
          </Link>
        </div>
      ) : null}
    </nav>
  );
}