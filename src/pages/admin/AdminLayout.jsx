import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext.jsx';

const cn = (...c) => c.filter(Boolean).join(' ');

export default function AdminLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const links = [
    { to: '/admin', label: t('dashboard'), end: true, icon: '📊' },
    { to: '/admin/partenaires', label: t('partners'), icon: '🤝' },
    { to: '/admin/projets', label: t('projects'), icon: '🔬' },
    { to: '/admin/appels', label: t('calls'), icon: '📢' },
    { to: '/admin/mobilites', label: t('mobility'), icon: '✈️' },
    { to: '/admin/news-events', label: t('Actualités'), icon: '📰' },
    { to: '/admin/documents', label: t('document'), icon: '📚' },
    { to: '/admin/roles', label: 'Rôles & permissions', icon: '🔐' },
    { to: '/admin/test-acces', label: 'Tester RBAC', icon: '🧪' },
    { to: '/admin/journal', label: "Journal d'audit", icon: '📜' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  const Nav = () => (
    <nav className="space-y-1">
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.end}
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
          <span aria-hidden>{l.icon}</span>
          {l.label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar desktop */}
      <aside className="hidden w-64 shrink-0 flex-col bg-navy p-4 lg:flex">
        <Link to="/" className="mb-6 flex items-center gap-2.5 px-2">
          <span
            translate="no"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-cobalt text-sm font-extrabold text-white"
          >
            ESI
          </span>
          <span className="text-sm font-bold text-white">{t('admin.title')}</span>
        </Link>
        <Nav />
        <div className="mt-auto border-t border-white/10 pt-4">
          <p className="px-3 text-xs text-slate-400" translate="no">{user?.email}</p>
          <button
            onClick={handleLogout}
            className="mt-2 w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white"
          >
            {t('admin.logout')}
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        {/* Barre mobile */}
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-navy"
            aria-label={t('admin.menuAria')}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-bold text-navy">{t('admin.title')}</span>
          <button onClick={handleLogout} className="text-sm font-medium text-cobalt">
            {t('admin.exit')}
          </button>
        </header>

        {open ? (
          <div className="bg-navy p-4 lg:hidden">
            <Nav />
          </div>
        ) : null}

        <main className="flex-1 p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}