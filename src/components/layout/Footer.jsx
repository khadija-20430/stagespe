import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();

  const columns = [
    {
      titleKey: 'footer.columns.consultation.title',
      links: [
        { to: '/cooperation', labelKey: 'footer.columns.consultation.cooperation' },
        { to: '/projets', labelKey: 'footer.columns.consultation.projets' },
        { to: '/appels', labelKey: 'footer.columns.consultation.appels' },
        { to: '/mobilites', labelKey: 'footer.columns.consultation.mobilites' },
      ],
    },
    {
      titleKey: 'footer.columns.resources.title',
      links: [
        { to: '/actualites', labelKey: 'footer.columns.resources.actualites' },
        { to: '/documents', labelKey: 'footer.columns.resources.documents' },
        { to: '/admin', labelKey: 'footer.columns.resources.admin' },
      ],
    },
  ];

  return (
    <footer className="bg-navy text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5">
            <span
              translate="no"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-cobalt text-sm font-extrabold text-white"
            >
              ESI
            </span>
            <span className="text-base font-bold text-white">
              {t('footer.brandName')}
            </span>
          </div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
            {t('footer.description')}
          </p>
        </div>

        {columns.map((col) => (
          <div key={col.titleKey}>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
              {t(col.titleKey)}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-slate-400 transition-colors hover:text-cobalt"
                  >
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} {t('footer.copyright')}</p>
          <p>{t('footer.department')}</p>
        </div>
      </div>
    </footer>
  );
}