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
      { to: '/agreements', labelKey: 'footer.columns.resources.agreements' }, // AJOUTÉ
      { to: '/admin', labelKey: 'footer.columns.resources.admin' },
    ],
    },
  ];

  // Réseaux sociaux (à adapter)
  const socialLinks = [
    { name: 'LinkedIn', icon: '🔗', href: '#' },
    { name: 'Twitter', icon: '𝕏', href: '#' },
    { name: 'Facebook', icon: 'f', href: '#' },
  ];

  return (
    <footer className="relative bg-gradient-to-b from-navy via-navy to-[#0a0f1a] text-slate-300 overflow-hidden">
      {/* Décoration de fond */}
      <div className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, #2563EB 0, transparent 50%)',
        }}
      />

      <div className="relative">
        {/* Section principale */}
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
            
            {/* Colonne 1: Brand + Description */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <span
                  translate="no"
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cobalt to-blue-600 text-sm font-extrabold text-white shadow-lg"
                >
                  ESI
                </span>
                <span className="text-base font-bold text-white">
                  {t('footer.brandName')}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-slate-400 mb-6">
                {t('footer.description')}
              </p>

              {/* Réseaux sociaux */}
              <div className="flex gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    aria-label={social.name}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white transition-all hover:bg-cobalt hover:scale-110"
                    title={social.name}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Colonnes: Liens */}
            {columns.map((col) => (
              <div key={col.titleKey}>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-white/90 mb-5">
                  {t(col.titleKey)}
                </h3>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        className="text-sm text-slate-400 transition-all hover:text-cobalt hover:translate-x-1"
                      >
                        → {t(link.labelKey)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Colonne 4: Localisation */}
            <div className="lg:col-span-1">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-white/90 mb-5">
                📍 {t('footer.location.title')}
              </h3>
              
              {/* Carte interactive */}
              <div className="relative rounded-lg overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm p-4 hover:border-cobalt/50 transition-all">
                {/* Icône lieu */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-cobalt/20 flex items-center justify-center text-cobalt">
                    📍
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {t('footer.location.schoolName')}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {t('footer.location.city')}<br/>
                      {t('footer.location.country')}
                    </p>
                    <a
                      href="https://maps.google.com/maps?q=esi+oued+smar+alger"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-cobalt hover:text-blue-300 transition-colors mt-2"
                    >
                      {t('footer.location.viewOnMaps')} →
                    </a>
                  </div>
                </div>
              </div>

              {/* Contact info */}
              <div className="mt-4 space-y-2">
                <p className="text-xs text-slate-400">
                  <span className="text-white font-semibold">{t('footer.contact.emailLabel')}</span><br/>
                  contact@esi.dz
                </p>
                <p className="text-xs text-slate-400">
                  <span className="text-white font-semibold">{t('footer.contact.phoneLabel')}</span><br/>
                  +213 (0) 21 XX XX XX
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10" />

        {/* Bottom section */}
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2 text-xs text-slate-500">
              <p>© {new Date().getFullYear()} {t('footer.copyright')}</p>
              <p>{t('footer.department')}</p>
            </div>
            
            {/* Quick links */}
            <div className="flex gap-6 text-xs">
              <a href="#" className="text-slate-400 hover:text-cobalt transition-colors">
                {t('footer.legal.privacyPolicy')}
              </a>
              <a href="#" className="text-slate-400 hover:text-cobalt transition-colors">
                {t('footer.legal.termsOfUse')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
