import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Eye, ExternalLink } from 'lucide-react'; // Icônes pro

import Card from '../../components/ui/Card.jsx';

import {
  getAppelsAdmin, getDocumentsAdmin, getMobilitesAdmin,
  getPartenairesAdmin, getProjetsAdmin, getActualitesAdmin,
  getAgreementsAdmin, getUsers,
} from '../../services/api.js';

export default function Dashboard() {
  const { t } = useTranslation();
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  const config = [
    { key: 'partenaires', label: t('partners'), fetch: getPartenairesAdmin, icon: '🤝' },
    { key: 'projets', label: t('projects'), fetch: getProjetsAdmin, icon: '🔬' },
    { key: 'appels', label: t('calls'), fetch: getAppelsAdmin, icon: '📢' },
    { key: 'mobilites', label: t('mobility'), fetch: getMobilitesAdmin, icon: '✈️' },
    { key: 'actualites', label: t('newsEvents'), fetch: getActualitesAdmin, icon: '📰' },
    { key: 'documents', label: t('document'), fetch: getDocumentsAdmin, icon: '📚' },
    { key: 'agreements', label: t('agreements', 'Accords'), fetch: getAgreementsAdmin, icon: '📄' },
    { key: 'users', label: t('users', 'Utilisateurs'), fetch: getUsers, icon: '👤' },
  ];

  useEffect(() => {
    let mounted = true;
    const loadCounts = async () => {
      setLoading(true);
      const results = await Promise.all(
        config.map(async (item) => {
          try {
            const data = await item.fetch();
            return { key: item.key, count: Array.isArray(data) ? data.length : 0 };
          } catch (error) {
            console.error(`Erreur chargement ${item.key}:`, error);
            return { key: item.key, count: 0 };
          }
        })
      );
      if (mounted) {
        const newCounts = {};
        results.forEach((result) => { newCounts[result.key] = result.count; });
        setCounts(newCounts);
        setLoading(false);
      }
    };
    loadCounts();
    return () => { mounted = false; };
  }, []);

  return (
    <div>
      {/* HEADER + BOUTON RETOUR */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy dark:text-white">
            📊 {t('admin.dashboard.title')}
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            {t('admin.dashboard.description')}
          </p>
        </div>

        <Link
          to="/"
          className="group inline-flex items-center gap-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-md transition-all"
        >
          <Eye size={18} className="text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
          <span>{t('admin.dashboard.backToSite')}</span>
          <ExternalLink size={16} className="text-slate-400" />
        </Link>
      </div>

      {/* STATS */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {config.map((item) => (
          <Card
            key={item.key}
            className="flex items-center gap-4 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:shadow-lg dark:hover:shadow-cobalt/20 transition-all group"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-cobalt/20 text-3xl group-hover:scale-110 transition-transform">
              {item.icon}
            </div>
            <div className="flex-1">
              <div className="text-4xl font-extrabold text-navy dark:text-white" translate="no">
                {loading ? (
                  <span className="inline-block h-8 w-12 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                ) : (
                  counts[item.key] ?? 0
                )}
              </div>
              <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">{item.label}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* WELCOME */}
      <div className="mt-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-cobalt/20 dark:to-blue-900/20 p-8">
        <h2 className="mb-3 text-2xl font-bold text-navy dark:text-white">
          👋 Bienvenue dans l'espace admin !
        </h2>
        <p className="leading-relaxed text-slate-700 dark:text-slate-300">
          Utilisez le menu de gauche pour gérer les partenaires, projets, appels à projets, mobilités,
          actualités, documents, accords, utilisateurs, rôles et permissions.
          Vous pouvez également changer la langue et le thème clair/sombre en haut à droite.
        </p>
      </div>
    </div>
  );
}