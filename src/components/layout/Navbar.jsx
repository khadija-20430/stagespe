import { useState , useRef} from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDarkMode } from '../../hooks/useDarkMode.js';
// Import des icônes Lucide
import { 
  Home, School, Globe, Sun, Moon, Lock, Menu, X, 
  ChevronDown, ArrowRight, Briefcase, FileText, Megaphone, 
  Plane, Newspaper, FolderOpen, Landmark, GraduationCap // Ajout de GraduationCap
} from 'lucide-react';

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
  const { t, i18n } = useTranslation();
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
        title={t('navbar.languageAria')}
      >
        <Globe className="h-5 w-5" />
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
  const { t } = useTranslation();
  const [isDark, setIsDark] = useDarkMode();

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="flex items-center justify-center h-10 w-10 text-slate-700 dark:text-slate-300 hover:text-cobalt dark:hover:text-cobalt transition-all"
      title={isDark ? t('lightMode') : t('darkMode')}
      aria-label={t('changeThemeAria')}
    >
      {isDark ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
}

function Dropdown({ label, items, pathname, icon }) {
  const [open, setOpen] = useState(false);
  const closeTimerRef = useRef(null);
  const isActive = items.some((i) => pathname.startsWith(i.to));

  const handleMouseEnter = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
    }, 200);
  };

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
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
        <span className="flex items-center">{icon}</span>
        <span>{label}</span>
        <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', open && 'rotate-180')} />
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
              <ArrowRight className="h-4 w-4" />
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
    { to: '/cooperation', label: t('navbar.cooperation'), icon: <Landmark className="h-4 w-4" /> },
    { to: '/projets', label: t('navbar.projets'), icon: <Briefcase className="h-4 w-4" /> },
    { to: '/appels', label: t('navbar.appels'), icon: <Megaphone className="h-4 w-4" /> },
    { to: '/mobilites', label: t('navbar.mobilites'), icon: <Plane className="h-4 w-4" /> },
    { to: '/programmes', label: t('programmes'), icon: <GraduationCap className="h-4 w-4" /> }, // AJOUT
  ];

  const ressources = [
    { to: '/actualites', label: t('navbar.actualites'), icon: <Newspaper className="h-4 w-4" /> },
    { to: '/documents', label: t('navbar.documents'), icon: <FolderOpen className="h-4 w-4" /> },
    { to: '/agreements', label: t('navbar.agreements'), icon: <FileText className="h-4 w-4" /> },
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
            <Home className="h-4 w-4 mr-2" />
            {t('navbar.home')}
          </NavLink>

          <NavLink
            to="/school"
            className={({ isActive }) =>
              cn(
                'flex min-h-[44px] items-center px-3 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'text-cobalt dark:text-cobalt border-b-2 border-cobalt'
                  : 'text-slate-700 dark:text-slate-300 hover:text-cobalt dark:hover:text-cobalt'
              )
            }
          >
            <School className="h-4 w-4 mr-2" />
            {t('school.defaultTitle')}
          </NavLink>

          <Dropdown label={t('navbar.consultationGroup')} items={consultation} pathname={pathname} icon={<Landmark className="h-4 w-4" />} />
          <Dropdown label={t('navbar.resourcesGroup')} items={ressources} pathname={pathname} icon={<FolderOpen className="h-4 w-4" />} />
        </div>

        {/* Right side - Desktop */}
        <div className="hidden items-center gap-2 lg:flex">
          <LanguageSwitcher />
          <DarkModeToggle />
          <Link
            to="/admin"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 px-4 text-sm font-semibold text-navy dark:text-white transition-all hover:border-cobalt dark:hover:border-cobalt hover:text-cobalt hover:bg-blue-50 dark:hover:bg-slate-800 hover:shadow-md"
          >
            <Lock className="h-4 w-4" />
            {t('navbar.admin')}
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
            aria-label={t('navbar.menuAria')}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
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
            <Home className="h-4 w-4" /> {t('navbar.home')}
          </NavLink>

          <NavLink
            to="/school"
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
            <School className="h-4 w-4" /> {t('school.defaultTitle')}
          </NavLink>

          <div className="my-3 border-t border-slate-200 dark:border-slate-700" />

          <div className="mb-3 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <Landmark className="h-3 w-3 inline mr-1" /> {t('navbar.consultationGroup')}
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
              {item.icon} {item.label}
            </NavLink>
          ))}

          <div className="my-3 border-t border-slate-200 dark:border-slate-700" />

          <div className="mb-3 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <FolderOpen className="h-3 w-3 inline mr-1" /> {t('navbar.resourcesGroup')}
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
              {item.icon} {item.label}
            </NavLink>
          ))}

          <div className="my-3 border-t border-slate-200 dark:border-slate-700" />

          <Link
            to="/admin"
            onClick={() => setMobileOpen(false)}
            className="flex items-center justify-center gap-2 mt-3 rounded-lg bg-gradient-to-r from-navy to-slate-800 dark:from-cobalt dark:to-blue-600 px-4 py-3 text-sm font-semibold text-white hover:shadow-lg transition-all"
          >
            <Lock className="h-4 w-4" /> {t('navbar.admin')}
          </Link>
        </div>
      )}
    </nav>
  );
}