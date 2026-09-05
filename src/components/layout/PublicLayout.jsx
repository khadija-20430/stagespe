import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';

export default function PublicLayout() {
  return (
    // 🆕 bg-surface dark:bg-slate-900 ajouté : avant, cette div n'avait aucun
    // fond et dépendait entièrement du body (qui était figé en clair, voir
    // le fix dans index.css). Le mettre aussi ici évite que le bug revienne
    // si jamais le style du body change ailleurs.
    <div className="flex min-h-screen flex-col bg-surface dark:bg-slate-900">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}