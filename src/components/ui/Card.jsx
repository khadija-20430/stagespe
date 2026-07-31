import { cn } from '../../lib/utils.js';

// Carte réutilisable — ombrage léger, coins arrondis 8px.
export default function Card({ className = '', hover = false, ...props }) {
  return (
    <div
      className={cn(
        'rounded-card border border-slate-200 bg-white shadow-card',
        hover &&
          'transition-shadow duration-200 hover:shadow-card-hover hover:border-slate-300',
        className
      )}
      {...props}
    />
  );
}
