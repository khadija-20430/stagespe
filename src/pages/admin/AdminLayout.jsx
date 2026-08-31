
import { useState } from 'react';
import {
  Link,
  NavLink,
  Outlet,
  useNavigate,
} from 'react-router-dom';

import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDarkMode } from '../../hooks/useDarkMode.js';

const cn = (...classes) => classes.filter(Boolean).join(' ');

export default function AdminLayout() {
  /* =========================================================
     HOOKS
  ========================================================= */

  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const [isDark, setIsDark] = useDarkMode();

  /* =========================================================
     MENU ADMIN
  ========================================================= */

  const links = [
    {
      to: '/admin',
      label: t('dashboard'),
      end: true,
      icon: '📊',
    },
    {
      to: '/admin/partenaires',
      label: t('partners'),
      icon: '🤝',
    },
    {
      to: '/admin/projets',
      label: t('projects'),
      icon: '🔬',
    },
    {
      to: '/admin/appels',
      label: t('calls'),
      icon: '📢',
    },
    {
      to: '/admin/mobilites',
      label: t('mobility'),
      icon: '✈️',
    },
    {
      to: '/admin/news-events',
      label: t('newsEvents'),
      icon: '📰',
    },
    {
      to: '/admin/documents',
      label: t('document'),
      icon: '📚',
    },
     {
    to: '/admin/settings-reset-password',
    label: 'Mot de passe',  // Ou utilisez t('admin.password') si vous avez la traduction
    icon: '🔑',
  },
    {
      to: '/admin/roles',
      label: 'Rôles & permissions',
      icon: '🔐',
    },
    {
      to: '/admin/test-acces',
      label: 'Tester RBAC',
      icon: '🧪',
    },
    {
      to: '/admin/journal',
      label: "Journal d'audit",
      icon: '📜',
    },
  ];

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erreur logout:', error);
    } finally {
      navigate('/admin/login', {
        replace: true,
      });
    }
  };

  /* =========================================================
     LANGUAGE
  ========================================================= */

  const changeLanguage = (language) => {
    i18n.changeLanguage(language);

    setLangOpen(false);

    if (language === 'ar') {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ar';
    } else {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = language;
    }
  };

  /* =========================================================
     NAVIGATION
  ========================================================= */

  const Nav = () => (
    <nav className="space-y-1">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',

              isActive
                ? 'bg-cobalt text-white'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            )
          }
        >
          <span
            aria-hidden="true"
            className="text-lg"
          >
            {link.icon}
          </span>

          <span>
            {link.label}
          </span>
        </NavLink>
      ))}
    </nav>
  );

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div
      className="
        flex min-h-screen
        bg-slate-50 dark:bg-slate-950
        text-slate-900 dark:text-white
        transition-colors
      "
    >

      {/* =====================================================
          SIDEBAR DESKTOP
      ===================================================== */}

      <aside
        className="
          hidden lg:flex
          w-64 shrink-0
          flex-col
          bg-navy
          p-4
          fixed
          left-0
          top-0
          bottom-0
          z-40
        "
      >

        {/* Logo */}

        <Link
          to="/admin"
          className="mb-6 flex items-center gap-2.5 px-2"
        >
          <span
            translate="no"
            className="
              flex h-10 w-10
              items-center justify-center
              rounded-lg
              bg-cobalt
              text-sm
              font-extrabold
              text-white
            "
          >
            ESI
          </span>

          <div>
            <p className="text-sm font-bold text-white">
              {t('admin.title')}
            </p>

            <p className="text-xs text-slate-400">
              Dashboard
            </p>
          </div>
        </Link>

        {/* Menu */}

        <div className="flex-1 overflow-y-auto">
          <Nav />
        </div>

        {/* User / Logout */}

        <div className="mt-4 border-t border-white/10 pt-4">

          <p
            className="px-3 text-xs text-slate-400 truncate"
            translate="no"
          >
            {user?.email || 'Admin'}
          </p>

          <p className="px-3 mt-1 text-xs text-slate-500">
            {user?.role || 'Utilisateur'}
          </p>

          <button
            onClick={handleLogout}
            className="
              mt-3
              w-full
              rounded-lg
              px-3 py-2.5
              text-left
              text-sm
              font-medium
              text-slate-300
              hover:bg-white/5
              hover:text-white
              transition-colors
            "
          >
            🚪 {t('admin.logout')}
          </button>

        </div>
      </aside>


      {/* =====================================================
          RIGHT SIDE
      ===================================================== */}

      <div className="flex min-w-0 flex-1 flex-col lg:ml-64">

        {/* ===================================================
            TOPBAR
        =================================================== */}

        <header
          className="
            sticky top-0
            z-30
            flex
            h-20
            items-center
            justify-between
            border-b
            border-slate-200
            dark:border-slate-700
            bg-white
            dark:bg-slate-900
            px-4
            sm:px-6
          "
        >

          {/* Mobile menu */}

          <div className="flex items-center gap-3">

            <button
              onClick={() => setOpen((value) => !value)}
              className="
                flex lg:hidden
                h-10 w-10
                items-center justify-center
                rounded-lg
                text-slate-700
                dark:text-slate-300
                hover:bg-slate-100
                dark:hover:bg-slate-800
              "
              aria-label={t('admin.menuAria')}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>


            {/* Mobile logo */}

            <div className="flex items-center gap-2 lg:hidden">

              <span
                translate="no"
                className="
                  flex h-9 w-9
                  items-center justify-center
                  rounded-lg
                  bg-cobalt
                  text-xs
                  font-extrabold
                  text-white
                "
              >
                ESI
              </span>

              <span className="font-bold text-navy dark:text-white">
                {t('admin.title')}
              </span>

            </div>

          </div>


          {/* Center title */}

          <div className="hidden md:block">

            <h1 className="text-lg font-bold text-navy dark:text-white">
              Espace Admin ESI
            </h1>

          </div>


          {/* =================================================
              RIGHT CONTROLS
          ================================================= */}

          <div className="flex items-center gap-2 sm:gap-3">


            {/* =================================================
                LANGUAGE
            ================================================= */}

            <div className="relative">

              <button
                onClick={() => setLangOpen((value) => !value)}
                className="
                  flex h-10 w-10
                  items-center justify-center
                  rounded-lg
                  text-slate-700
                  dark:text-slate-300
                  hover:bg-slate-100
                  dark:hover:bg-slate-800
                  transition
                "
                title="Changer la langue"
              >
                🌐
              </button>


              {langOpen && (
                <div
                  className="
                    absolute
                    right-0
                    top-full
                    mt-2
                    w-48
                    overflow-hidden
                    rounded-xl
                    border
                    border-slate-200
                    dark:border-slate-700
                    bg-white
                    dark:bg-slate-800
                    shadow-xl
                    z-50
                  "
                >

                  {/* Français */}

                  <button
                    onClick={() => changeLanguage('fr')}
                    className={cn(
                      'w-full px-4 py-3 text-left text-sm',

                      i18n.language === 'fr'
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-cobalt'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    )}
                  >
                    🇫🇷 Français
                  </button>


                  {/* English */}

                  <button
                    onClick={() => changeLanguage('en')}
                    className={cn(
                      'w-full px-4 py-3 text-left text-sm',

                      i18n.language === 'en'
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-cobalt'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    )}
                  >
                    🇬🇧 English
                  </button>


                  {/* Arabic */}

                  <button
                    onClick={() => changeLanguage('ar')}
                    className={cn(
                      'w-full px-4 py-3 text-left text-sm',

                      i18n.language === 'ar'
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-cobalt'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    )}
                  >
                    🇩🇿 العربية
                  </button>

                </div>
              )}

            </div>


            {/* =================================================
                DARK MODE
            ================================================= */}

            <button
              onClick={() => setIsDark(!isDark)}
              className="
                flex h-10 w-10
                items-center justify-center
                rounded-lg
                text-slate-700
                dark:text-slate-300
                hover:bg-slate-100
                dark:hover:bg-slate-800
                transition
              "
              title={isDark ? 'Mode clair' : 'Mode sombre'}
              aria-label="Changer le thème"
            >
              {isDark ? '☀️' : '🌙'}
            </button>


            {/* Separator */}

            <div
              className="
                hidden sm:block
                h-8
                w-px
                bg-slate-200
                dark:bg-slate-700
              "
            />


            {/* User */}

            <div className="hidden sm:block text-right">

              <p className="text-sm font-medium text-navy dark:text-white">
                {user?.full_name || 'Admin'}
              </p>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                {user?.role || 'Utilisateur'}
              </p>

            </div>


            {/* Logout */}

            <button
              onClick={handleLogout}
              className="
                hidden sm:flex
                h-10 w-10
                items-center justify-center
                rounded-lg
                text-red-600
                hover:bg-red-50
                dark:hover:bg-red-900/20
                transition
              "
              title="Déconnexion"
            >
              🚪
            </button>

          </div>

        </header>


        {/* ===================================================
            MOBILE SIDEBAR
        =================================================== */}

        {open && (
          <div className="lg:hidden">

            {/* Overlay */}

            <div
              className="
                fixed
                inset-0
                z-40
                bg-black/40
              "
              onClick={() => setOpen(false)}
            />


            {/* Menu */}

            <aside
              className="
                fixed
                left-0
                top-20
                bottom-0
                z-50
                w-72
                overflow-y-auto
                bg-navy
                p-4
              "
            >

              <Nav />


              {/* Mobile user */}

              <div className="mt-6 border-t border-white/10 pt-4">

                <p
                  className="px-3 text-xs text-slate-400 truncate"
                  translate="no"
                >
                  {user?.email || 'Admin'}
                </p>

                <p className="px-3 mt-1 text-xs text-slate-500">
                  {user?.role || 'Utilisateur'}
                </p>

                <button
                  onClick={handleLogout}
                  className="
                    mt-3
                    w-full
                    rounded-lg
                    px-3 py-2.5
                    text-left
                    text-sm
                    text-slate-300
                    hover:bg-white/5
                    hover:text-white
                  "
                >
                  🚪 {t('admin.logout')}
                </button>

              </div>

            </aside>

          </div>
        )}


        {/* ===================================================
            PAGE CONTENT
        =================================================== */}

        <main className="flex-1 p-4 sm:p-8">
          <Outlet />
        </main>

      </div>

    </div>
  );
}

