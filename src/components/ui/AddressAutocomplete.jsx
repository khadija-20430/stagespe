import { useState, useRef, useEffect } from 'react';

// ============================================================
// AUTOCOMPLÉTION D'ADRESSE
// Utilise l'API Nominatim (OpenStreetMap) — gratuite, sans clé API,
// cohérente avec geocode.js déjà utilisé pour le bouton "Localiser".
// ============================================================

export default function AddressAutocomplete({ value, onChange, onSelect, placeholder }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  // Ferme la liste de suggestions si on clique ailleurs sur la page
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = (query) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query || query.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    // Attend 400ms sans frappe avant d'appeler l'API — évite une requête
    // à chaque lettre tapée
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&addressdetails=1&q=${encodeURIComponent(query)}`;
        const res = await fetch(url, { headers: { 'Accept-Language': 'fr' } });
        const data = await res.json();
        setSuggestions(Array.isArray(data) ? data : []);
        setOpen(true);
      } catch (err) {
        console.error('Erreur autocomplétion adresse:', err);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    onChange(val);
    fetchSuggestions(val);
  };

  const handleSelect = (suggestion) => {
    onChange(suggestion.display_name);
    onSelect({
      latitude: parseFloat(suggestion.lat),
      longitude: parseFloat(suggestion.lon),
      displayName: suggestion.display_name,
    });
    setSuggestions([]);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={value ?? ''}
        onChange={handleInputChange}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-cobalt focus:ring-1 focus:ring-cobalt/30 transition"
      />

      {loading && (
        <div className="absolute right-3 top-2.5 text-xs text-slate-400">...</div>
      )}

      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg">
          {suggestions.map((s) => (
            <li
              key={s.place_id}
              onClick={() => handleSelect(s)}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700 last:border-0"
            >
              {s.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}