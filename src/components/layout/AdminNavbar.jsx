import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, useNavigate } from 'react-router-dom';

import { useDarkMode } from '../../hooks/useDarkMode.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function AdminNavbar() {
  const { t, i18n } = useTranslation();
  const [isDark, setIsDark] = useDarkMode();

  const [langOpen, setLangOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const languages = [
    { code: 'fr', name: '🇫🇷 Français' },
    { code: 'en', name: '🇬🇧 English' },
    { code: 'ar', name: '🇩🇿 العربية' },
  ];

  const menuItems = [
    {
      path: '/admin',
      icon: '📊',
      label: t('admin.nav.dashboard'),
    },
    {
      path: '/admin/partenaires',
      icon: '🤝',
      label: t('admin.nav.partners'),
    },
    {
      path: '/admin/projets',
      icon: '🔬',
      label: t('admin.nav.projects'),
    },
    {
      path: '/admin/appels',
      icon: '📢',
      label: t('admin.nav.calls'),
    },
    {
      path: '/admin/mobilites',
      icon: '✈️',
      label: t('admin.nav.mobility'),
    },
    {
      path: '/admin/news-events',
      icon: '📰',
      label: t('admin.nav.news'),
    },
    {
      path: '/admin/documents',
      icon: '📚',
      label: t('admin.nav.documents'),
    },
    {
      path: '/admin/agreements',
      icon: '📄',
      label: t('admin.nav.agreements'),
    },
    {
      path: '/admin/users',
      icon: '👤',
      label: t('admin.nav.users'),
    },
    {
      path: '/admin/roles',
      icon: '🔑',
      label: t('admin.nav.roles'),
    },
    {
      path: '/admin/school-presentation',
      icon: '🏫',
      label: t('admin.nav.school'),
    },
    {
      path: '/admin/test-acces',
      icon: '🧪',
      label: t('admin.nav.testAccess'),
    },
    {
      path: '/admin/journal',
      icon: '📋',
      label: t('admin.nav.audit'),
    },
    {
      path: '/admin/settings/reset-password',
      icon: '⚙️',
      label: t('admin.nav.settings'),
    },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    setLangOpen(false);
  };

  return (
    <>
      {/* TOP NAVBAR */}
      <nav
        className="
          fixed top-0 left-0 right-0
          z-50
          h-20
          border-b
          border-slate-200
          dark:border-slate-700
          bg-white
          dark:bg-slate-900
          shadow-sm
        "
      >
        <div className="h-full flex items-center justify-between px-4 sm:px-6">

          {/* LEFT - LOGO */}
          <div className="flex items-center gap-3">

            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="
                lg:hidden
                flex items-center justify-center
                h-10 w-10
                rounded-lg
                text-slate-700
                dark:text-slate-300
                hover:bg-slate-100
                dark:hover:bg-slate-800
              "
              aria-label={t('admin.nav.menuAria')}
            >
              ☰
            </button>

            <div
              translate="no"
              className="
                flex h-11 w-11
                items-center justify-center
                rounded-lg
                bg-gradient-to-br
                from-cobalt
                to-blue-600
                text-sm
                font-extrabold
                text-white
                shadow-lg
              "
            >
              ESI
            </div>

            <div className="hidden sm:flex flex-col leading-tight">
              <span className="text-sm font-bold text-navy dark:text-white">
                {t('admin.nav.admin')}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {t('admin.nav.dashboard')}
              </span>
            </div>
          </div>

          {/* CENTER */}
          <div className="hidden md:block">
            <h1 className="text-lg font-bold text-navy dark:text-white">
              {t('admin.nav.title')}
            </h1>
          </div>

          {/* RIGHT CONTROLS */}
          <div className="flex items-center gap-2 sm:gap-4">

            {/* LANGUAGE */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="
                  flex items-center justify-center
                  h-10 w-10
                  rounded-lg
                  text-slate-700
                  dark:text-slate-300
                  hover:bg-slate-100
                  dark:hover:bg-slate-800
                  hover:text-cobalt
                  transition
                "
                title={t('admin.nav.changeLanguage')}
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10a15.3 15.3 0 0 1-4 10a15.3 15.3 0 0 1-4-10a15.3 15.3 0 0 1 4-10z" />
                </svg>
              </button>

              {langOpen && (
                <div
                  className="
                    absolute right-0 top-full mt-2
                    w-48
                    rounded-xl
                    border
                    border-slate-200
                    dark:border-slate-600
                    bg-white
                    dark:bg-slate-800
                    shadow-xl
                    overflow-hidden
                  "
                >
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`
                        w-full
                        px-4 py-3
                        text-left
                        text-sm
                        font-medium
                        transition
                        ${
                          i18n.language === lang.code
                            ? `
                              bg-blue-50
                              dark:bg-blue-900/30
                              text-cobalt
                            `
                            : `
                              text-slate-700
                              dark:text-slate-300
                              hover:bg-slate-50
                              dark:hover:bg-slate-700
                            `
                        }
                      `}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* DARK / LIGHT MODE */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="
                flex items-center justify-center
                h-10 w-10
                rounded-lg
                text-slate-700
                dark:text-slate-300
                hover:bg-slate-100
                dark:hover:bg-slate-800
                hover:text-cobalt
                transition
              "
              title={isDark ? t('admin.nav.lightMode') : t('admin.nav.darkMode')}
            >
              {isDark ? (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            {/* USER */}
            <div
              className="
                hidden sm:flex
                items-center gap-3
                border-l
                border-slate-200
                dark:border-slate-700
                pl-4
              "
            >
              <div className="text-right">
                <p className="text-sm font-medium text-navy dark:text-white">
                  {user?.full_name || t('admin.nav.admin')}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                  {user?.role || t('admin.nav.user')}
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="
                  px-3 py-2
                  text-sm
                  text-red-600
                  hover:bg-red-50
                  dark:hover:bg-red-900/20
                  rounded-lg
                  transition
                "
                title={t('admin.nav.logout')}
              >
                🚪
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* SIDEBAR DESKTOP */}
      <aside
        className="
          hidden lg:flex
          fixed
          top-20
          left-0
          bottom-0
          z-40
          w-64
          flex-col
          border-r
          border-slate-200
          dark:border-slate-700
          bg-white
          dark:bg-slate-900
          shadow-sm
        "
      >
        <div className="px-5 pt-6 pb-3">
          <p
            className="
              text-xs
              font-semibold
              uppercase
              tracking-wider
              text-slate-400
              dark:text-slate-500
            "
          >
            {t('admin.nav.administration')}
          </p>
        </div>

        <div className="flex-1 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-3
                px-4 py-3
                rounded-lg
                text-sm
                font-medium
                transition-all
                ${
                  isActive
                    ? `
                      bg-blue-50
                      dark:bg-blue-900/30
                      text-cobalt
                      dark:text-blue-400
                      shadow-sm
                    `
                    : `
                      text-slate-700
                      dark:text-slate-300
                      hover:bg-slate-100
                      dark:hover:bg-slate-800
                    `
                }
              `}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        <div className="p-3 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={handleLogout}
            className="
              w-full
              flex items-center gap-3
              px-4 py-3
              rounded-lg
              text-sm
              font-medium
              text-red-600
              hover:bg-red-50
              dark:hover:bg-red-900/20
              transition
            "
          >
            <span className="text-xl">🚪</span>
            {t('admin.nav.logout')}
          </button>
        </div>
      </aside>

      {/* SIDEBAR MOBILE */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setMenuOpen(false)}
          />

          <aside
            className="
              fixed
              top-20
              left-0
              bottom-0
              z-50
              w-72
              bg-white
              dark:bg-slate-900
              border-r
              border-slate-200
              dark:border-slate-700
              shadow-xl
              lg:hidden
            "
          >
            <div className="px-4 pt-6 pb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {t('admin.nav.administration')}
              </p>
            </div>

            <div className="px-3 space-y-1">
              {menuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) => `
                    flex items-center gap-3
                    px-4 py-3
                    rounded-lg
                    text-sm
                    font-medium
                    ${
                      isActive
                        ? `
                          bg-blue-50
                          dark:bg-blue-900/30
                          text-cobalt
                        `
                        : `
                          text-slate-700
                          dark:text-slate-300
                          hover:bg-slate-100
                          dark:hover:bg-slate-800
                        `
                    }
                  `}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </aside>
        </>
      )}
    </>
  );
}