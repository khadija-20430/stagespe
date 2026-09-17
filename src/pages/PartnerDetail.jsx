import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { getPartenaireById, getFileUrl } from '../services/api.js';
import Loader from '../components/ui/Loader.jsx';
import Badge from '../components/ui/Badge.jsx';

export default function PartnerDetail() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const [partner, setPartner] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setPartner(null);
    setError('');
    getPartenaireById(id, i18n.language)
      .then(setPartner)
      .catch((err) => setError(err.message || 'Erreur de chargement'));
  }, [id, i18n.language]);

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-red-600">{error}</p>
        <Link to="/cooperation" className="text-cobalt hover:underline mt-4 inline-block">
          {t('common.backToList', { defaultValue: 'Retour à la liste' })}
        </Link>
      </div>
    );
  }

  if (!partner) return <Loader />;

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <Link
        to="/cooperation"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-cobalt transition mb-6"
      >
        <ArrowLeft size={16} />
        {t('common.back', { defaultValue: 'Retour' })}
      </Link>

      {/* --- En-tête --- */}
      <div className="flex items-center gap-4">
        {partner.logo ? (
          <img
            src={getFileUrl(partner.logo)}
            alt={partner.nom}
            className="h-16 w-16 rounded-lg border border-slate-100 dark:border-slate-700 object-contain bg-white"
          />
        ) : (
          <span className="text-4xl">🏫</span>
        )}
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-white">{partner.nom}</h1>
          <p className="text-slate-500 dark:text-slate-400">{partner.ville}, {partner.pays}</p>
        </div>
      </div>

      {/* --- Description --- */}
      {partner.description && (
        <p className="mt-6 text-slate-700 dark:text-slate-300 leading-relaxed">{partner.description}</p>
      )}

      {/* --- Infos rapides --- */}
      <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
        {partner.typeEtablissement && (
          <div>
            <dt className="text-slate-400 dark:text-slate-500">{t('typeEtablissement')}</dt>
            <dd className="font-medium text-slate-700 dark:text-slate-200">{partner.typeEtablissement}</dd>
          </div>
        )}
        {partner.typePartenariat && (
          <div>
            <dt className="text-slate-400 dark:text-slate-500">{t('typePartenariat')}</dt>
            <dd className="font-medium text-slate-700 dark:text-slate-200">{partner.typePartenariat}</dd>
          </div>
        )}
        {partner.partnershipStatus && (
          <div>
            <dt className="text-slate-400 dark:text-slate-500">{t('statutPartenariat')}</dt>
            <dd>
              <Badge tone={partner.partnershipStatus === 'active' ? 'green' : 'amber'}>
                {t(partner.partnershipStatus)}
              </Badge>
            </dd>
          </div>
        )}
        {partner.site && (
          <div>
            <dt className="text-slate-400 dark:text-slate-500">{t('siteWeb')}</dt>
            <dd>
              <a
                href={partner.site}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-cobalt hover:underline"
              >
                {partner.site}
              </a>
            </dd>
          </div>
        )}
      </dl>

      {/* --- Thèmes --- */}
      {partner.themeNames?.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-1.5">
          {partner.themeNames.map((th) => (
            <span
              key={th}
              className="rounded-full bg-slate-100 dark:bg-slate-700 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300"
            >
              {th}
            </span>
          ))}
        </div>
      )}

      {/* --- Conventions --- */}
      {Array.isArray(partner.agreements) && partner.agreements.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">
            {t('agreements', { defaultValue: 'Conventions' })}
          </h2>
          <ul className="space-y-2">
            {partner.agreements.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 p-3 text-sm"
              >
                <span className="font-medium text-navy dark:text-white">{a.title || a.titre}</span>
                {a.status && (
                  <Badge tone={a.status === 'active' ? 'green' : 'slate'}>{a.status}</Badge>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* --- Projets communs --- */}
      {Array.isArray(partner.projects) && partner.projects.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">
            {t('projects', { defaultValue: 'Projets communs' })}
          </h2>
          <ul className="space-y-2">
            {partner.projects.map((p) => (
              <li
                key={p.id}
                className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 text-sm text-navy dark:text-white"
              >
                {p.title || p.titre}
              </li>
            ))}
          </ul>
        </section>
      )}

      {Array.isArray(partner.contacts) && partner.contacts.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">
            {t('institutionalContact', { defaultValue: 'Contact institutionnel' })}
          </h2>
          <div className="space-y-3">
            {partner.contacts.map((c) => (
              <div key={c.id} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                <p className="font-medium text-navy dark:text-white">
                  {c.fullName}
                  {c.isPrimary && (
                    <Badge tone="cobalt" className="ml-2">
                      {t('primaryContact', { defaultValue: 'Principal' })}
                    </Badge>
                  )}
                </p>
                {c.position && <p className="text-sm text-slate-500 dark:text-slate-400">{c.position}</p>}
                {c.email && (
                  <a href={`mailto:${c.email}`} className="text-sm text-cobalt hover:underline">
                    {c.email}
                  </a>
                )}
                {c.phone && <p className="text-sm text-slate-500 dark:text-slate-400">{c.phone}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}