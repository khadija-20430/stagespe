import { useEffect, useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import Card from '../../components/ui/Card.jsx';
import {
  getAppels,
  getDocuments,
  getMobilites,
  getPartenaires,
  getProjets,
} from '../../services/api.js';

export default function Dashboard() {
  const { t } = useTranslation();
  const [counts, setCounts] = useState({});

  const config = [
    { key: 'partenaires', label: t('admin.nav.partners'), fetch: getPartenaires, icon: '🤝' },
    { key: 'projets', label: t('admin.nav.projects'), fetch: getProjets, icon: '🔬' },
    { key: 'appels', label: t('admin.nav.calls'), fetch: getAppels, icon: '📢' },
    { key: 'mobilites', label: t('admin.nav.mobility'), fetch: getMobilites, icon: '✈️' },
    { key: 'documents', label: t('admin.nav.documents'), fetch: getDocuments, icon: '📄' },
  ];

  useEffect(() => {
    config.forEach((c) => {
      c.fetch().then((d) => setCounts((prev) => ({ ...prev, [c.key]: d.length })));
    });
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">{t('admin.dashboard.title')}</h1>
      <p className="mt-1 text-slate-600">{t('admin.dashboard.description')}</p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {config.map((c) => (
          <Card key={c.key} className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-2xl">
              {c.icon}
            </div>
            <div>
              <div className="text-3xl font-extrabold text-navy" translate="no">
                {counts[c.key] ?? '—'}
              </div>
              <div className="text-sm text-slate-500">{c.label}</div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-8 p-6">
        <h2 className="font-bold text-navy">{t('admin.dashboard.about.title')}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          <Trans
            i18nKey="admin.dashboard.about.text"
            components={{ code: <code className="rounded bg-slate-100 px-1 py-0.5" /> }}
          />
        </p>
      </Card>
    </div>
  );
}