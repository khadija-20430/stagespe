import { cn } from '../../lib/utils.js';

// Badge d'état / catégorie.
const tones = {
  default: 'bg-slate-100 text-slate-700',
  cobalt: 'bg-blue-50 text-cobalt',
  navy: 'bg-navy text-white',
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
};

export default function Badge({ tone = 'default', className = '', children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        tones[tone] ?? tones.default,
        className
      )}
    >
      {children}
    </span>
  );
}

// Aide : associe un statut métier à une tonalité de couleur.
export function statutTone(statut) {
  const map = {
    Ouvert: 'green',
    'En cours': 'cobalt',
    Bientôt: 'amber',
    Terminé: 'default',
    Fermé: 'red',
  };
  return map[statut] ?? 'default';
}
