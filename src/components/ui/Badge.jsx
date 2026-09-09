import { cn } from '../../lib/utils.js';

const tones = {
  default: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  cobalt: 'bg-blue-50 text-cobalt dark:bg-cobalt/20 dark:text-blue-400',
  navy: 'bg-navy text-white dark:bg-slate-700 dark:text-white',
  green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  red: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
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