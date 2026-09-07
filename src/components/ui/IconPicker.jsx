import { useState, useRef, useEffect } from 'react';
import { ChevronDown, GraduationCap, Megaphone, Globe, FlaskConical, Users, BookOpen } from 'lucide-react';

// ⚠️ Doit couvrir exactement les mêmes noms que LUCIDE_ICONS dans ManageHomeSlides.jsx
// et que ICON_MAP dans Home.jsx. Si vous ajoutez une icône dans LUCIDE_ICONS,
// importez-la ci-dessus et ajoutez-la ici.
const ICON_COMPONENTS = {
  GraduationCap,
  Megaphone,
  Globe,
  FlaskConical,
  Users,
  BookOpen,
};

/**
 * IconPicker — sélecteur d'icône Lucide sous forme de dropdown.
 *
 * Props:
 * - value: string (nom de l'icône actuellement sélectionnée, ex: "Globe")
 * - onChange: (newValue: string) => void
 * - options: string[] (liste des noms d'icônes autorisés, ex: LUCIDE_ICONS)
 */
export default function IconPicker({ value, onChange, options = [] }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Ferme le dropdown si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const SelectedIcon = ICON_COMPONENTS[value];

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500 transition"
      >
        <span className="flex items-center gap-2">
          {SelectedIcon ? (
            <>
              <SelectedIcon size={18} />
              <span>{value}</span>
            </>
          ) : (
            <span className="text-slate-400">Choisir une icône</span>
          )}
        </span>
        <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl">
          {options.map((name) => {
            const Icon = ICON_COMPONENTS[name];
            const isSelected = name === value;
            return (
              <button
                key={name}
                type="button"
                onClick={() => {
                  onChange(name);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-cobalt'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {Icon ? <Icon size={18} /> : <span className="w-[18px]" />}
                <span>{name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}