import { cn } from '../../lib/utils.js';

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  as: Component = 'button',
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

  const sizes = {
    md: 'min-h-[44px] px-5 text-base',
    sm: 'min-h-[40px] px-4 text-sm',
    lg: 'min-h-[48px] px-7 text-base',
  };

  const variants = {
    primary: 'bg-cobalt text-white hover:bg-blue-700',
    secondary:
      'border border-slate-300 bg-white text-navy hover:border-cobalt hover:text-cobalt dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:hover:border-cobalt dark:hover:text-blue-400',
    navy: 'bg-navy text-white hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600',
    ghost: 'text-navy hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };

  return (
    <Component
      className={cn(base, sizes[size], variants[variant], className)}
      {...props}
    />
  );
}