import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';

import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext.jsx';
import { usePermissions } from '../../context/PermissionsContext.jsx';
import { useDarkMode } from '../../hooks/useDarkMode.js';
import NotificationBell from '../../components/ui/NotificationBell.jsx';

// Import des icônes professionnelles
import { 
  LayoutDashboard, School, Handshake, FlaskConical, Megaphone, Plane, 
  Newspaper, FileText, FolderOpen, Users, KeyRound, FlaskConical as TestTube,
  ClipboardList, Settings, LogOut, Globe, Moon, Sun, Eye, Menu, X, ChevronDown, ChevronUp,
  GraduationCap // Ajout pour les programmes
} from 'lucide-react';

const cn = (...classes) => classes.filter(Boolean).join(' ');

export default function AdminLayout() {
  /* =========================================================
     HOOKS
  ========================================================= */

  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [isMini, setIsMini] = useState(false);

  const [isDark, setIsDark] = useDarkMode();

  /* =========================================================
     MENU ADMIN
  ========================================================= */

  const links = [
    {
      to: '/admin',
      label: t('dashboard'),
      end: true,
      icon: LayoutDashboard,
    },
    {
      to: '/admin/school-presentation',
      label: t('presentationEcole'),
      icon: School,
      requiredPerm: 'school_presentation.view',
    },
    {
      to: '/admin/partenaires',
      label: t('partners'),
      icon: Handshake,
      requiredPerm: 'partners.view',
    },
    {
      to: '/admin/projets',
      label: t('projects'),
      icon: FlaskConical,
      requiredPerm: 'projects.view',
    },
    {
      to: '/admin/programmes', // ✅ Lien programmes
      label: t('programmes'),
      icon: GraduationCap,
      //requiredPerm: 'programmes.view',
    },
    {
      to: '/admin/appels',
      label: t('calls'),
      icon: Megaphone,
      requiredPerm: 'calls.view',
    },
    {
      to: '/admin/mobilites',
      label: t('mobility'),
      icon: Plane,
      requiredPerm: 'mobility.view',
    },
    {
      to: '/admin/news-events',
      label: t('newsEvents'),
      icon: Newspaper,
      requiredPerm: 'news_events.view',
    },
    {
      to: '/admin/agreements',
      label: t('agreements'),
      icon: FileText,
      requiredPerm: 'agreements.view',
    },
    {
      to: '/admin/documents',
      label: t('document'),
      icon: FolderOpen,
      requiredPerm: 'documents.view',
    },
    {
      to: '/admin/users',
      label: t('users'),
      icon: Users,
      requiredPerm: 'users.view',
    },
    {
      to: '/admin/roles',
      label: t('adminRoles'),
      icon: KeyRound,
      superAdminOnly: true,
    },
    {
      to: '/admin/test-acces',
      label: t('adminTestAccess'),
      icon: TestTube,
      superAdminOnly: true,
    },
    {
      to: '/admin/journal',
      label: t('adminAuditLog'),
      icon: ClipboardList,
      superAdminOnly: true,
    },
    {
      to: '/admin/settings/reset-password',
      label: t('password'),
      icon: Settings,
      superAdminOnly: true,
    },
  ];

  const canSeeLink = (link) => {
    if (link.superAdminOnly) return user?.role === 'super_admin';
    if (link.requiredPerm) return hasPermission(link.requiredPerm);
    return true;
  };

  const visibleLinks = links.filter(canSeeLink);

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erreur logout:', error);
    } finally {
      navigate('/admin/login', { replace: true });
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
     NAVIGATION (Adaptée au mode mini)
  ========================================================= */

  const Nav = () => (
    <nav className={`space-y-1 ${isMini ? 'px-0' : ''}`}>
      {visibleLinks.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            cn(
              'flex items-center rounded-lg text-sm font-medium transition-colors',
              isMini ? 'justify-center p-3' : 'gap-3 px-3 py-2.5',
              isActive
                ? 'bg-cobalt text-white'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            )
          }
          title={link.label}
        >
          <link.icon size={20} className="shrink-0" />
          {!isMini && <span>{link.label}</span>}
        </NavLink>
      ))}
    </nav>
  );

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors">

      {/* =====================================================
          SIDEBAR DESKTOP (RÉDUCTIBLE)
      ===================================================== */}

      <aside
        className={`hidden lg:flex shrink-0 flex-col bg-navy p-4 fixed left-0 top-0 bottom-0 z-40 transition-all duration-300 ${
          isMini ? 'w-20' : 'w-64'
        }`}
      >
        {/* Logo CLICKABLE AVEC PASTILLE BLEUE VIVE */}
        <button
          onClick={() => setIsMini(!isMini)}
          className="group mb-6 flex items-center gap-2.5 px-2 focus:outline-none w-full"
          title={isMini ? 'Agrandir le menu' : 'Réduire le menu'}
        >
          <span
            translate="no"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cobalt text-sm font-extrabold text-white shadow-lg transition-all duration-300 group-hover:scale-110"
          >
            ESI
          </span>

          {/* Texte + Indicateur (disparaît en mini) */}
          {!isMini && (
            <div className="flex flex-1 items-center justify-between overflow-hidden">
              <div className="text-left">
                <p className="text-sm font-bold text-white">{t('admin.title')}</p>
                <p className="text-xs text-slate-400">{t('dashboard')}</p>
              </div>

              {/* PASTILLE BLEUE VIVE AVEC GLOW ET ANIMATION */}
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-500/50 transition-all duration-300 group-hover:bg-blue-400 group-hover:scale-110 group-hover:shadow-blue-300/60 animate-soft-bounce">
                {isMini ? (
                  <ChevronDown size={18} />
                ) : (
                  <ChevronUp size={18} />
                )}
              </div>
            </div>
          )}
        </button>

        {/* Menu */}
        <div className={`flex-1 overflow-y-auto ${isMini ? 'px-0' : ''}`}>
          <Nav />
        </div>

        {/* User / Logout */}
        <div className={`mt-4 border-t border-white/10 pt-4 ${isMini ? 'flex flex-col items-center' : ''}`}>
          {!isMini && (
            <>
              <p className="px-3 text-xs text-slate-400 truncate" translate="no">
                {user?.email || t('adminFallbackName')}
              </p>
              <p className="px-3 mt-1 text-xs text-slate-500">
                {user?.role || t('enums.userRole.utilisateur')}
              </p>
            </>
          )}

          <button
            onClick={handleLogout}
            className={`mt-3 w-full rounded-lg py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-colors ${
              isMini ? 'flex items-center justify-center px-0' : 'flex items-center gap-3 px-3 text-left'
            }`}
            title={t('admin.logout')}
          >
            <LogOut size={20} className="shrink-0" />
            {!isMini && t('admin.logout')}
          </button>
        </div>
      </aside>

      {/* =====================================================
          RIGHT SIDE
      ===================================================== */}

      <div className={`flex min-w-0 flex-1 flex-col transition-all duration-300 ${isMini ? 'lg:ml-20' : 'lg:ml-64'}`}>

        {/* ===================================================
            TOPBAR
        =================================================== */}

        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 sm:px-6">

          {/* Mobile menu */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen((value) => !value)}
              className="flex lg:hidden h-10 w-10 items-center justify-center rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label={t('admin.menuAria')}
            >
              {open ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Mobile logo */}
            <div className="flex items-center gap-2 lg:hidden">
              <span translate="no" className="flex h-9 w-9 items-center justify-center rounded-lg bg-cobalt text-xs font-extrabold text-white">
                ESI
              </span>
              <span className="font-bold text-navy dark:text-white">{t('admin.title')}</span>
            </div>
          </div>

          {/* Center title */}
          <div className="hidden md:block">
            <h1 className="text-lg font-bold text-navy dark:text-white">{t('adminSpaceTitle')}</h1>
          </div>

          {/* =================================================
              RIGHT CONTROLS
          ================================================= */}

          <div className="flex items-center gap-2 sm:gap-3">

            {/* BOUTON RETOUR SITE VISITEUR */}
            <Link
              to="/"
              className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-cobalt transition"
              title={t('admin.nav.backToSite')}
            >
              <Eye size={18} />
              <span className="hidden lg:inline">{t('admin.nav.backToSite')}</span>
            </Link>

            {/* LANGUAGE */}
            <div className="relative">
              <button
                onClick={() => setLangOpen((value) => !value)}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title={t('changeLanguageAria')}
              >
                <Globe size={20} />
              </button>

              {langOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl z-50">
                  <button
                    onClick={() => changeLanguage('fr')}
                    className={cn('w-full px-4 py-3 text-left text-sm', i18n.language === 'fr' ? 'bg-blue-50 dark:bg-blue-900/30 text-cobalt' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700')}
                  >
                    🇫🇷 Français
                  </button>
                  <button
                    onClick={() => changeLanguage('en')}
                    className={cn('w-full px-4 py-3 text-left text-sm', i18n.language === 'en' ? 'bg-blue-50 dark:bg-blue-900/30 text-cobalt' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700')}
                  >
                    🇬🇧 English
                  </button>
                  <button
                    onClick={() => changeLanguage('ar')}
                    className={cn('w-full px-4 py-3 text-left text-sm', i18n.language === 'ar' ? 'bg-blue-50 dark:bg-blue-900/30 text-cobalt' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700')}
                  >
                    🇩🇿 العربية
                  </button>
                </div>
              )}
            </div>

            {/* DARK MODE */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title={isDark ? t('lightMode') : t('darkMode')}
              aria-label={t('changeThemeAria')}
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* 🔔 NOTIFICATIONS */}
            <NotificationBell />

            {/* Separator */}
            <div className="hidden sm:block h-8 w-px bg-slate-200 dark:bg-slate-700" />

            {/* User */}
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-navy dark:text-white">{user?.full_name || t('adminFallbackName')}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{user?.role || t('enums.userRole.utilisateur')}</p>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="hidden sm:flex h-10 w-10 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
              title={t('admin.logout')}
            >
              <LogOut size={20} />
            </button>

          </div>
        </header>

        {/* ===================================================
            MOBILE SIDEBAR
        =================================================== */}

        {open && (
          <div className="lg:hidden">
            <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setOpen(false)} />
            <aside className="fixed left-0 top-20 bottom-0 z-50 w-72 overflow-y-auto bg-navy p-4">
              <Nav />
              <div className="mt-6 border-t border-white/10 pt-4">
                <p className="px-3 text-xs text-slate-400 truncate" translate="no">{user?.email || t('adminFallbackName')}</p>
                <p className="px-3 mt-1 text-xs text-slate-500">{user?.role || t('enums.userRole.utilisateur')}</p>
                <button
                  onClick={handleLogout}
                  className="mt-3 w-full rounded-lg px-3 py-2.5 text-left text-sm text-slate-300 hover:bg-white/5 hover:text-white"
                >
                  <LogOut size={20} className="inline mr-2" /> {t('admin.logout')}
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