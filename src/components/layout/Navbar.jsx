import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDarkMode } from '../../hooks/useDarkMode.js';

const cn = (...c) => c.filter(Boolean).join(' ');

function Logo() {
  const { t } = useTranslation();
  return (
    <Link to="/" className="flex items-center gap-2.5 group" aria-label={t('navbar.homeAria')}>
      <span
        translate="no"
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cobalt to-blue-600 text-sm font-extrabold text-white shadow-lg group-hover:shadow-xl transition-shadow dark:shadow-cobalt/20"
      >
        ESI
      </span>
      <span className="hidden flex-col leading-tight sm:flex">
        <span className="text-sm font-bold text-navy dark:text-white group-hover:text-cobalt transition-colors">{t('navbar.brandLine1')}</span>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('navbar.brandLine2')}</span>
      </span>
    </Link>
  );
}
function LanguageSwitcher({ className = '' }) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  const languages = [
    { code: 'fr', name: 'Français' },
    { code: 'en', name: 'English' },
    { code: 'ar', name: 'العربية' },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center justify-center h-10 w-10 text-slate-700 dark:text-slate-300 hover:text-cobalt dark:hover:text-cobalt transition-all',
          className
        )}
        title="Language / Langue / اللغة"
      >
        {/* Globe SVG */}
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-40 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-card-hover z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                i18n.changeLanguage(lang.code);
                setOpen(false);
              }}
              className={cn(
                'w-full px-4 py-3 text-left text-sm font-medium transition-all',
                i18n.language === lang.code
                  ? 'bg-blue-50 dark:bg-cobalt/20 text-cobalt dark:text-cobalt'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              )}
            >
              {lang.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DarkModeToggle() {
  const [isDark, setIsDark] = useDarkMode();

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="flex items-center justify-center h-10 w-10 text-slate-700 dark:text-slate-300 hover:text-cobalt dark:hover:text-cobalt transition-all"
      title={isDark ? 'Light Mode' : 'Dark Mode'}
      aria-label="Toggle dark mode"
    >
      {isDark ? (
        // Soleil SVG
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        // Lune SVG
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

function Dropdown({ label, items, pathname, icon }) {
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
          'flex min-h-[44px] items-center gap-2 px-3 text-sm font-medium transition-all duration-200',
          isActive
            ? 'text-cobalt dark:text-cobalt'
            : 'text-slate-700 dark:text-slate-300 hover:text-cobalt dark:hover:text-cobalt'
        )}
      >
        <span>{icon}</span>
        <span>{label}</span>
        <svg
          className={cn('h-4 w-4 transition-transform duration-200', open && 'rotate-180')}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 w-72 mt-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-2 shadow-card-hover backdrop-blur animate-in fade-in slide-in-from-top-2 duration-200">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive: a }) =>
                cn(
                  'flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-150',
                  a
                    ? 'bg-blue-50 dark:bg-cobalt/20 text-cobalt dark:text-cobalt'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:translate-x-1'
                )
              }
            >
              <span>→</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      )}
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
    <nav className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm dark:shadow-none">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Logo />

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-2 lg:flex">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn(
                'flex min-h-[44px] items-center px-3 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'text-cobalt dark:text-cobalt border-b-2 border-cobalt'
                  : 'text-slate-700 dark:text-slate-300 hover:text-cobalt dark:hover:text-cobalt'
              )
            }
          >
             {t('navbar.home')}
          </NavLink>

          <NavLink
            to="/ecole"
            className={({ isActive }) =>
              cn(
                'flex min-h-[44px] items-center px-3 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'text-cobalt dark:text-cobalt border-b-2 border-cobalt'
                  : 'text-slate-700 dark:text-slate-300 hover:text-cobalt dark:hover:text-cobalt'
              )
            }
          >
             Présentation de l'école
          </NavLink>

          <Dropdown label={t('navbar.consultationGroup')} items={consultation} pathname={pathname}  />
          <Dropdown label={t('navbar.resourcesGroup')} items={ressources} pathname={pathname} />
        </div>

        {/* Right side - Desktop */}
        <div className="hidden items-center gap-2 lg:flex">
          <LanguageSwitcher />
          <DarkModeToggle />
          <Link
            to="/admin"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 px-4 text-sm font-semibold text-navy dark:text-white transition-all hover:border-cobalt dark:hover:border-cobalt hover:text-cobalt hover:bg-blue-50 dark:hover:bg-slate-800 hover:shadow-md"
          >
            🔐 {t('navbar.admin')}
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-2 lg:hidden">
          <LanguageSwitcher className="h-9 w-auto" />
          <DarkModeToggle />
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-navy dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="border-t border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-4 py-4 lg:hidden animate-in slide-in-from-top duration-200">
          <NavLink
            to="/"
            end
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium transition-all',
                isActive
                  ? 'bg-blue-50 dark:bg-cobalt/20 text-cobalt'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              )
            }
          >
            🏠 {t('navbar.home')}
          </NavLink>

          <NavLink
            to="/ecole"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium transition-all',
                isActive
                  ? 'bg-blue-50 dark:bg-cobalt/20 text-cobalt'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              )
            }
          >
            Présentation de l'école
          </NavLink>

          <div className="my-3 border-t border-slate-200 dark:border-slate-700" />

          <div className="mb-3 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            📋 {t('navbar.consultationGroup')}
          </div>
          {consultation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium transition-all ml-4',
                  isActive
                    ? 'bg-blue-50 dark:bg-cobalt/20 text-cobalt'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                )
              }
            >
              → {item.label}
            </NavLink>
          ))}

          <div className="my-3 border-t border-slate-200 dark:border-slate-700" />

          <div className="mb-3 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
             {t('navbar.resourcesGroup')}
          </div>
          {ressources.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium transition-all ml-4',
                  isActive
                    ? 'bg-blue-50 dark:bg-cobalt/20 text-cobalt'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                )
              }
            >
              → {item.label}
            </NavLink>
          ))}

          <div className="my-3 border-t border-slate-200 dark:border-slate-700" />

          <Link
            to="/admin"
            onClick={() => setMobileOpen(false)}
            className="flex items-center justify-center gap-2 mt-3 rounded-lg bg-gradient-to-r from-navy to-slate-800 dark:from-cobalt dark:to-blue-600 px-4 py-3 text-sm font-semibold text-white hover:shadow-lg transition-all"
          >
            🔐 {t('navbar.admin')}
          </Link>
        </div>
      )}
    </nav>
  );
}