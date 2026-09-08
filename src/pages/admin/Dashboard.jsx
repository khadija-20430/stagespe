import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Handshake, FlaskConical, Megaphone, Plane,
  Newspaper, FolderOpen, FileText, Users, LayoutDashboard,
  GraduationCap, Image
} from 'lucide-react';

import Card from '../../components/ui/Card.jsx';

import {
  getAppelsAdmin, getDocumentsAdmin, getMobilitesAdmin,
  getPartenairesAdmin, getProjetsAdmin, getActualitesAdmin,
  getAgreementsAdmin, getUsers, getProgrammesAdmin, getHomeSlidesAdmin,
} from '../../services/api.js';

export default function Dashboard() {
  const { t } = useTranslation();
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  const config = [
    { key: 'homeSlides', label: t('admin.homeSlides.title'), fetch: getHomeSlidesAdmin, icon: Image },
    { key: 'partenaires', label: t('partners'), fetch: getPartenairesAdmin, icon: Handshake },
    { key: 'projets', label: t('projects'), fetch: getProjetsAdmin, icon: FlaskConical },
    { key: 'programmes', label: t('programmes'), fetch: getProgrammesAdmin, icon: GraduationCap },
    { key: 'appels', label: t('calls'), fetch: getAppelsAdmin, icon: Megaphone },
    { key: 'mobilites', label: t('mobility'), fetch: getMobilitesAdmin, icon: Plane },
    { key: 'actualites', label: t('newsEvents'), fetch: getActualitesAdmin, icon: Newspaper },
    { key: 'documents', label: t('document'), fetch: getDocumentsAdmin, icon: FolderOpen },
    { key: 'agreements', label: t('agreements', 'Accords'), fetch: getAgreementsAdmin, icon: FileText },
    { key: 'users', label: t('users', 'Utilisateurs'), fetch: getUsers, icon: Users },
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
      {/* HEADER - SANS LE BOUTON RETOUR */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy dark:text-white flex items-center gap-3">
            <LayoutDashboard size={30} className="text-cobalt" />
            {t('admin.dashboard.title')}
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            {t('admin.dashboard.description')}
          </p>
        </div>
        {/* ❌ BOUTON "VOIR LE SITE" SUPPRIMÉ */}
      </div>

      {/* STATS */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {config.map((item) => (
          <Card
            key={item.key}
            className="flex items-center gap-4 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:shadow-lg dark:hover:shadow-cobalt/20 transition-all group"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-cobalt/20 text-cobalt dark:text-blue-300 group-hover:scale-110 transition-transform">
              <item.icon size={26} />
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
    </div>
  );
}