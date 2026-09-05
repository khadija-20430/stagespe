import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Import des icônes UI génériques (toujours disponibles dans lucide-react)
import { 
  MapPin, Mail, Phone, ArrowRight 
} from 'lucide-react';

// 🔒 Définition des icônes SVG locales (Cela évite tout problème d'import ou de version)
const SocialIcons = {
  Facebook: (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  ),
  X: (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  ),
  LinkedIn: (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  ),
  YouTube: (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  ),
};

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
        { to: '/agreements', labelKey: 'footer.columns.resources.agreements' },
        { to: '/admin', labelKey: 'footer.columns.resources.admin' },
      ],
    },
  ];

  // ✅ VRAIS RÉSEAUX SOCIAUX OFFICIELS DE L'ESI
  const socialLinks = [
    { name: 'Facebook', href: 'https://www.facebook.com/ESI.Page/', icon: SocialIcons.Facebook },
    { name: 'Twitter / X', href: 'https://x.com/EsiAlger', icon: SocialIcons.X },
    { name: 'LinkedIn', href: 'https://www.linkedin.com/school/ecole-superieure-informatique-alger/', icon: SocialIcons.LinkedIn },
    { name: 'YouTube', href: 'https://www.youtube.com/@ESICHANNEL', icon: SocialIcons.YouTube },
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
                    target="_blank"
                    rel="noopener noreferrer"
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
                        className="flex items-center gap-2 text-sm text-slate-400 transition-all hover:text-cobalt hover:translate-x-1"
                      >
                        <ArrowRight className="h-4 w-4 shrink-0" />
                        {t(link.labelKey)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Colonne 4: Localisation */}
            <div className="lg:col-span-1">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/90 mb-5">
                <MapPin className="h-4 w-4 text-cobalt" /> {t('footer.location.title')}
              </h3>
              
              {/* Carte interactive */}
              <div className="relative rounded-lg overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm p-4 hover:border-cobalt/50 transition-all">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-cobalt/20 flex items-center justify-center text-cobalt">
                    <MapPin className="h-4 w-4" />
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
                      {t('footer.location.viewOnMaps')} <ArrowRight className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Contact info */}
              <div className="mt-4 space-y-2">
                <p className="text-xs text-slate-400 flex items-start gap-2">
                  <Mail className="h-4 w-4 text-cobalt mt-0.5 shrink-0" />
                  <span>
                    <span className="text-white font-semibold">{t('footer.contact.emailLabel')}</span><br/>
                    contact@esi.dz
                  </span>
                </p>
                <p className="text-xs text-slate-400 flex items-start gap-2">
                  <Phone className="h-4 w-4 text-cobalt mt-0.5 shrink-0" />
                  <span>
                    <span className="text-white font-semibold">{t('footer.contact.phoneLabel')}</span><br/>
                    +213 23 93 91 32
                  </span>
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