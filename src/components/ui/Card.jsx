import { cn } from '../../lib/utils.js';

export default function Card({ className = '', hover = false, ...props }) {
  return (
    <div
      className={cn(
        'rounded-card border border-slate-200 bg-white shadow-card dark:border-slate-700 dark:bg-slate-800 dark:shadow-none',
        hover &&
          'transition-shadow duration-200 hover:shadow-card-hover hover:border-slate-300 dark:hover:border-slate-600',
        className
      )}
      {...props}
    />
  );
}