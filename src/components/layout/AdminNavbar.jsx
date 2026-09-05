import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useDarkMode } from '../../hooks/useDarkMode.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  LayoutDashboard, Handshake, FlaskConical, Megaphone, Plane, 
  Newspaper, FolderOpen, FileText, Users, KeyRound, School, FlaskConical as TestTube,
  ClipboardList, Settings, LogOut, Globe, Moon, Sun, Eye, Menu, X, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';

export default function AdminNavbar() {
  const { t, i18n } = useTranslation();
  const [isDark, setIsDark] = useDarkMode();
  const [langOpen, setLangOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMini, setIsMini] = useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const languages = [
    { code: 'fr', name: 'Francais' },
    { code: 'en', name: 'English' },
    { code: 'ar', name: 'العربية' },
  ];

  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: t('admin.nav.dashboard') },
    { path: '/admin/partenaires', icon: Handshake, label: t('admin.nav.partners') },
    { path: '/admin/projets', icon: FlaskConical, label: t('admin.nav.projects') },
    { path: '/admin/appels', icon: Megaphone, label: t('admin.nav.calls') },
    { path: '/admin/mobilites', icon: Plane, label: t('admin.nav.mobility') },
    { path: '/admin/news-events', icon: Newspaper, label: t('admin.nav.news') },
    { path: '/admin/documents', icon: FolderOpen, label: t('admin.nav.documents') },
    { path: '/admin/agreements', icon: FileText, label: t('admin.nav.agreements') },
    { path: '/admin/users', icon: Users, label: t('admin.nav.users') },
    { path: '/admin/roles', icon: KeyRound, label: t('admin.nav.roles') },
    { path: '/admin/school-presentation', icon: School, label: t('admin.nav.school') },
    { path: '/admin/test-acces', icon: TestTube, label: t('admin.nav.testAccess') },
    { path: '/admin/journal', icon: ClipboardList, label: t('admin.nav.audit') },
    { path: '/admin/settings/reset-password', icon: Settings, label: t('admin.nav.settings') },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    setLangOpen(false);
  };

  const getLinkClass = ({ isActive }) => [
    'flex items-center rounded-lg text-sm font-medium transition-all',
    isMini ? 'justify-center p-3' : 'gap-3 px-4 py-3',
    isActive
      ? 'bg-blue-50 dark:bg-blue-900/30 text-cobalt dark:text-blue-400 shadow-sm'
      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
  ].join(' ');

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 h-20 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
        <div className="h-full flex items-center justify-between px-4 sm:px-6">

          <div className="flex items-center gap-2 lg:gap-3">

            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden flex items-center justify-center h-10 w-10 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <button
              type="button"
              onClick={() => setIsMini(prev => !prev)}
              className="hidden lg:flex items-center justify-center h-10 w-10 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Reduire ou agrandir le menu"
            >
              {isMini ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
            </button>

            <div className="flex-shrink-0 flex items-center justify-center h-11 w-11 rounded-lg bg-gradient-to-br from-cobalt to-blue-600 text-sm font-extrabold text-white shadow-lg select-none">
              ESI
            </div>

            <div
              className="hidden sm:flex flex-col leading-tight overflow-hidden transition-all duration-300"
              style={{ opacity: isMini ? 0 : 1, width: isMini ? 0 : 'auto' }}
            >
              <span className="text-sm font-bold text-navy dark:text-white whitespace-nowrap">{t('admin.nav.admin')}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{t('admin.nav.dashboard')}</span>
            </div>
          </div>

          <div className="hidden md:block">
            <h1 className="text-lg font-bold text-navy dark:text-white">{t('admin.nav.title')}</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/"
              className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-cobalt transition"
              title={t('admin.nav.backToSite')}
            >
              <Eye size={18} />
              <span className="hidden lg:inline">{t('admin.nav.backToSite')}</span>
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center justify-center h-10 w-10 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-cobalt transition"
                title={t('admin.nav.changeLanguage')}
              >
                <Globe size={20} />
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-xl overflow-hidden z-50">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => changeLanguage(lang.code)}
                      className={[
                        'w-full px-4 py-3 text-left text-sm font-medium transition',
                        i18n.language === lang.code
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-cobalt'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700',
                      ].join(' ')}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsDark(!isDark)}
              className="flex items-center justify-center h-10 w-10 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-cobalt transition"
              title={isDark ? t('admin.nav.lightMode') : t('admin.nav.darkMode')}
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div className="hidden sm:flex items-center gap-3 border-l border-slate-200 dark:border-slate-700 pl-4">
              <div className="text-right">
                <p className="text-sm font-medium text-navy dark:text-white">{user?.full_name || t('admin.nav.admin')}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user?.role || t('admin.nav.user')}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                title={t('admin.nav.logout')}
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <aside
        className="hidden lg:flex fixed top-20 left-0 bottom-0 z-40 flex-col border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm transition-all duration-300"
        style={{ width: isMini ? '5rem' : '16rem' }}
      >
        <div className="px-5 pt-6 pb-3">
          {!isMini && (
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {t('admin.nav.administration')}
            </p>
          )}
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto px-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              className={getLinkClass}
              title={item.label}
            >
              <item.icon size={20} className="shrink-0" />
              {!isMini && <span>{item.label}</span>}
            </NavLink>
          ))}
        </div>

        <div className="p-3 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={handleLogout}
            className={[
              'w-full flex items-center rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition',
              isMini ? 'justify-center p-3' : 'gap-3 px-4 py-3',
            ].join(' ')}
            title={t('admin.nav.logout')}
          >
            <LogOut size={20} />
            {!isMini && t('admin.nav.logout')}
          </button>
        </div>
      </aside>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMenuOpen(false)} />
          <aside className="fixed top-20 left-0 bottom-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 shadow-xl lg:hidden">
            <div className="px-4 pt-6 pb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t('admin.nav.administration')}</p>
            </div>
            <div className="px-3 space-y-1">
              {menuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/admin'}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) => [
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium',
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-cobalt'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
                  ].join(' ')}
                >
                  <item.icon size={20} />
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