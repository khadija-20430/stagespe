import { useEffect, useState } from 'react';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';

const cn = (...c) => c.filter(Boolean).join(' ');

// Génère un id local pour les nouveaux éléments (mock).
let seq = 0;
const nextId = (prefix) => `${prefix}-new-${Date.now()}-${seq++}`;

function emptyItem(fields) {
  const obj = {};
  fields.forEach((f) => {
    obj[f.name] = f.type === 'list' ? '' : '';
  });
  return obj;
}

// Composant CRUD réutilisable pour toutes les entités admin.
// props:
//  - title, idPrefix
//  - fetcher() -> Promise<array>
//  - columns: [{ key, label, render? }]
//  - fields: [{ name, label, type: 'text'|'textarea'|'select'|'list', options? }]
export default function CrudManager({ title, idPrefix, fetcher, columns, fields }) {
  const [items, setItems] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState(null);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetcher().then(setItems);
  }, [fetcher]);

  const openCreate = () => {
    setDraft(emptyItem(fields));
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    // convertit les champs 'list' (tableaux) en chaîne pour l'édition
    const d = { ...item };
    fields.forEach((f) => {
      if (f.type === 'list' && Array.isArray(d[f.name])) {
        d[f.name] = d[f.name].join(', ');
      }
    });
    setDraft(d);
    setEditingId(item.id);
    setModalOpen(true);
  };

  const remove = (id) => {
    if (window.confirm('Supprimer cet élément ?')) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
  };

  const save = (e) => {
    e.preventDefault();
    const payload = { ...draft };
    fields.forEach((f) => {
      if (f.type === 'list') {
        payload[f.name] = String(payload[f.name] || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }
    });

    if (editingId) {
      setItems((prev) => prev.map((i) => (i.id === editingId ? { ...i, ...payload } : i)));
    } else {
      setItems((prev) => [{ ...payload, id: nextId(idPrefix) }, ...prev]);
    }
    setModalOpen(false);
  };

  const setField = (name, value) => setDraft((d) => ({ ...d, [name]: value }));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {items === null ? '…' : `${items.length} élément(s)`} · gestion en mémoire (mock)
          </p>
        </div>
        <Button onClick={openCreate}>+ Ajouter</Button>
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                {columns.map((c) => (
                  <th key={c.key} className="px-5 py-3.5 font-semibold">{c.label}</th>
                ))}
                <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items === null ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-5 py-10 text-center text-slate-400">
                    Chargement…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-5 py-10 text-center text-slate-400">
                    Aucun élément.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    {columns.map((c) => (
                      <td key={c.key} className="px-5 py-4 text-slate-700">
                        {c.render ? c.render(item) : String(item[c.key] ?? '')}
                      </td>
                    ))}
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => openEdit(item)}>
                          Modifier
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => remove(item.id)}>
                          Supprimer
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {modalOpen && draft ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4" onClick={() => setModalOpen(false)}>
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-card bg-white p-6 shadow-card-hover"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-navy">
              {editingId ? 'Modifier' : 'Ajouter'} — {title}
            </h2>
            <form onSubmit={save} className="mt-5 space-y-4">
              {fields.map((f) => (
                <div key={f.name}>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">{f.label}</label>
                  {f.type === 'textarea' ? (
                    <textarea
                      value={draft[f.name] ?? ''}
                      onChange={(e) => setField(f.name, e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-cobalt focus:outline-none focus:ring-2 focus:ring-cobalt/30"
                    />
                  ) : f.type === 'select' ? (
                    <select
                      value={draft[f.name] ?? ''}
                      onChange={(e) => setField(f.name, e.target.value)}
                      className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 text-base focus:border-cobalt focus:outline-none focus:ring-2 focus:ring-cobalt/30"
                    >
                      <option value="">—</option>
                      {f.options.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={draft[f.name] ?? ''}
                      onChange={(e) => setField(f.name, e.target.value)}
                      placeholder={f.type === 'list' ? 'Séparés par des virgules' : ''}
                      className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 text-base focus:border-cobalt focus:outline-none focus:ring-2 focus:ring-cobalt/30"
                    />
                  )}
                </div>
              ))}
              <div className={cn('flex justify-end gap-3 pt-2')}>
                <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">Enregistrer</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
