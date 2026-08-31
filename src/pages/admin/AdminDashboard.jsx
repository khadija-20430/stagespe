import { Outlet } from 'react-router-dom';
import AdminNavbar from '../../components/layout/AdminNavbar.jsx';

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-colors">

      <AdminNavbar />

      <main className="pt-20 lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <Outlet />
        </div>
      </main>

    </div>
  );
}

