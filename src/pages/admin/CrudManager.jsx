import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';

const cn = (...c) => c.filter(Boolean).join(' ');

function emptyItem(fields) {
  const obj = {};
  fields.forEach((f) => {
    obj[f.name] = f.type === 'number' ? 0 : '';
  });
  return obj;
}

export default function CrudManager({
  title, idPrefix, fetcher, columns, fields, toPayload,
  onCreate, onUpdate, onDelete, onPublish, onArchive,
}) {
  const { t } = useTranslation();
  const [items, setItems] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const reload = () => fetcher().then(setItems);

  useEffect(() => {
    reload();
  }, [fetcher]);

  const openCreate = () => {
    setDraft(emptyItem(fields));
    setEditingId(null);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (item) => {
    const d = { ...item };
    fields.forEach((f) => {
      if (f.type === 'list' && Array.isArray(d[f.name])) {
        d[f.name] = d[f.name].join(', ');
      }
    });
    setDraft(d);
    setEditingId(item.id);
    setError('');
    setModalOpen(true);
  };

  const remove = async (id) => {
    if (!window.confirm(t('admin.crud.confirmDelete'))) return;
    try {
      await onDelete(id);
      await reload();
    } catch (err) {
      alert(err.message || 'Erreur lors de la suppression');
    }
  };

  const doPublish = async (id) => {
    if (!onPublish) return;
    setActionLoadingId(id);
    try {
      await onPublish(id);
      await reload();
    } catch (err) {
      alert(err.message || 'Erreur lors de la publication');
    } finally {
      setActionLoadingId(null);
    }
  };

  const doArchive = async (id) => {
    if (!onArchive) return;
    setActionLoadingId(id);
    try {
      await onArchive(id);
      await reload();
    } catch (err) {
      alert(err.message || "Erreur lors de l'archivage");
    } finally {
      setActionLoadingId(null);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const cleanDraft = { ...draft };
      fields.forEach((f) => {
        if (f.type === 'list' && !Array.isArray(cleanDraft[f.name])) {
          cleanDraft[f.name] = String(cleanDraft[f.name] || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        }
        if (f.type === 'number') {
          cleanDraft[f.name] = Number(cleanDraft[f.name]) || 0;
        }
      });

      const payload = toPayload ? toPayload(cleanDraft) : cleanDraft;

      if (editingId) {
        await onUpdate(editingId, payload);
      } else {
        await onCreate(payload);
      }
      await reload();
      setModalOpen(false);
    } catch (err) {
      setError(err.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const setField = (name, value) =>
    setDraft((d) => ({
      ...d,
      [name]: typeof value === 'function' ? value(d[name], d) : value,
    }));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {items === null ? '…' : t('admin.crud.itemsCount', { count: items.length })}
          </p>
        </div>
        <Button onClick={openCreate}>{t('admin.crud.add')}</Button>
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                {columns.map((c) => (
                  <th key={c.key} className="px-5 py-3.5 font-semibold">{c.label}</th>
                ))}
                <th className="px-5 py-3.5 text-right font-semibold">{t('admin.crud.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {items === null ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-5 py-10 text-center text-slate-400">
                    {t('admin.crud.loading')}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-5 py-10 text-center text-slate-400">
                    {t('admin.crud.empty')}
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
                      <div className="flex flex-wrap justify-end gap-2">
                        {onPublish && item.statutPublication !== 'published' ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={actionLoadingId === item.id}
                            onClick={() => doPublish(item.id)}
                          >
                            {actionLoadingId === item.id ? '...' : 'Publier'}
                          </Button>
                        ) : null}
                        {onArchive && item.statutPublication !== 'archived' ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={actionLoadingId === item.id}
                            onClick={() => doArchive(item.id)}
                          >
                            {actionLoadingId === item.id ? '...' : 'Archiver'}
                          </Button>
                        ) : null}
                        <Button size="sm" variant="secondary" onClick={() => openEdit(item)}>
                          {t('admin.crud.edit')}
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => remove(item.id)}>
                          {t('admin.crud.delete')}
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
              {editingId ? t('admin.crud.modalEdit') : t('admin.crud.modalAdd')} — {title}
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
                      <option value="">{t('admin.crud.selectPlaceholder')}</option>
                      {f.options.map((o) => {
                        const value = typeof o === 'object' ? o.value : o;
                        const label = typeof o === 'object' ? o.label : o;
                        return <option key={value} value={value}>{label}</option>;
                      })}
                    </select>
                  ) : f.type === 'number' ? (
                    <input
                      type="number"
                      value={draft[f.name] ?? 0}
                      onChange={(e) => setField(f.name, e.target.value)}
                      className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 text-base focus:border-cobalt focus:outline-none focus:ring-2 focus:ring-cobalt/30"
                    />
                  ) : f.type === 'file' ? (
                    <div>
                      {draft[f.name] ? (
                        <p className="mb-2 truncate text-sm text-slate-500">
                          {t('admin.crud.currentFile')} :{' '}
                          <span className="font-medium text-slate-700">{draft[f.name]}</span>
                        </p>
                      ) : null}
                      <input
                        type="file"
                        accept={f.accept}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (f.onFile) f.onFile(file, setField);
                        }}
                        className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-cobalt file:px-3 file:py-2 file:text-sm file:font-medium file:text-white file:cursor-pointer hover:file:bg-cobalt/90"
                      />
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={draft[f.name] ?? ''}
                      onChange={(e) => setField(f.name, e.target.value)}
                      placeholder={f.type === 'list' ? t('admin.crud.listPlaceholder') : ''}
                      className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 text-base focus:border-cobalt focus:outline-none focus:ring-2 focus:ring-cobalt/30"
                    />
                  )}
                </div>
              ))}
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <div className={cn('flex justify-end gap-3 pt-2')}>
                <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
                  {t('admin.crud.cancel')}
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? '...' : t('admin.crud.save')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}