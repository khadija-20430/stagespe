import { Link } from 'react-router-dom';

const columns = [
  {
    title: 'Consultation',
    links: [
      { to: '/cooperation', label: 'Coopération internationale' },
      { to: '/projets', label: 'Projets' },
      { to: '/appels', label: 'Appels à projets' },
      { to: '/mobilites', label: 'Mobilités' },
    ],
  },
  {
    title: 'Ressources',
    links: [
      { to: '/actualites', label: 'Actualités & événements' },
      { to: '/documents', label: 'Bibliothèque de documents' },
      { to: '/admin', label: 'Espace administrateur' },
    ],
  },
];

export default function Footer() {
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
              Coopération Internationale
            </span>
          </div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
            Portail institutionnel de l'École Supérieure en Informatique dédié à
            la coopération internationale : projets, mobilités, appels et
            partenariats académiques.
          </p>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
              {col.title}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-slate-400 transition-colors hover:text-cobalt"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} École Supérieure en Informatique — Tous droits réservés.</p>
          <p>Direction des Relations Internationales</p>
        </div>
      </div>
    </footer>
  );
}
