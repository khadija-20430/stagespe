import { cn } from '../../lib/utils.js';

export default function FilterChip({ active = false, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'min-h-[36px] rounded-full border px-4 text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt focus-visible:ring-offset-1',
        active
          ? 'border-cobalt bg-cobalt text-white'
          : 'border-slate-300 bg-white text-slate-600 hover:border-cobalt hover:text-cobalt dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-cobalt dark:hover:text-blue-400'
      )}
    >
      {children}
    </button>
  );
}