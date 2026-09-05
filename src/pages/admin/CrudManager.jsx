import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import {
  LayoutGrid, Loader2, AlertTriangle, Inbox, Pencil, Trash2, X, Plus,
  Save, MapPin,
} from 'lucide-react';

const cn = (...c) => c.filter(Boolean).join(' ');

function emptyItem(fields) {
  const obj = {};

  fields.forEach((f) => {
    obj[f.name] = f.type === 'number' ? 0 : '';
  });

  return obj;
}

export default function CrudManager({
  title,
  idPrefix,
  fetcher,
  columns,
  fields,
  toPayload,
  onCreate,
  onUpdate,
  onDelete,
  onPublish,
  onArchive,
  icon: Icon = LayoutGrid,
}) {
  const { t } = useTranslation();

  // =========================================================
  // STATE — LOGIQUE ORIGINALE
  // =========================================================
  const [items, setItems] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeMsg, setGeocodeMsg] = useState('');

  // UI
  const [pubDropdown, setPubDropdown] = useState(null);

  // =========================================================
  // CHARGER
  // =========================================================
  const reload = () => fetcher().then(setItems);

  useEffect(() => {
    reload();
  }, [fetcher]);

  // =========================================================
  // CRÉER
  // =========================================================
  const openCreate = () => {
    setDraft(emptyItem(fields));
    setEditingId(null);
    setError('');
    setGeocodeMsg('');
    setModalOpen(true);
  };

  // =========================================================
  // EDITER
  // =========================================================
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
    setGeocodeMsg('');
    setModalOpen(true);
  };

  // =========================================================
  // SUPPRIMER
  // =========================================================
  const remove = async (id) => {
    if (!window.confirm(t('admin.crud.confirmDelete'))) return;

    try {
      await onDelete(id);
      await reload();
    } catch (err) {
      alert(err.message || 'Erreur lors de la suppression');
    }
  };

  // =========================================================
  // PUBLIER
  // =========================================================
  const doPublish = async (id) => {
    if (!onPublish) return;

    setActionLoadingId(id);

    try {
      await onPublish(id);
      await reload();
      setPubDropdown(null);
    } catch (err) {
      alert(err.message || 'Erreur lors de la publication');
    } finally {
      setActionLoadingId(null);
    }
  };

  // =========================================================
  // ARCHIVER
  // =========================================================
  const doArchive = async (id) => {
    if (!onArchive) return;

    setActionLoadingId(id);

    try {
      await onArchive(id);
      await reload();
      setPubDropdown(null);
    } catch (err) {
      alert(err.message || "Erreur lors de l'archivage");
    } finally {
      setActionLoadingId(null);
    }
  };

  // =========================================================
  // SAUVEGARDER
  // =========================================================
  const save = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError('');

    try {
      const cleanDraft = { ...draft };

      // Transformer les listes
      fields.forEach((f) => {
        if (
          f.type === 'list' &&
          !Array.isArray(cleanDraft[f.name])
        ) {
          cleanDraft[f.name] = String(
            cleanDraft[f.name] || ''
          )
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        }

        // Transformer les nombres
        if (f.type === 'number') {
          cleanDraft[f.name] =
            Number(cleanDraft[f.name]) || 0;
        }
      });

      // Payload
      const payload = toPayload
        ? toPayload(cleanDraft)
        : cleanDraft;

      if (editingId) {
        await onUpdate(editingId, payload);
      } else {
        await onCreate(payload);
      }

      // Recharger depuis le backend
      await reload();

      setModalOpen(false);
    } catch (err) {
      setError(
        err.message ||
        "Erreur lors de l'enregistrement"
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // CHAMP
  // =========================================================
  const setField = (name, value) =>
    setDraft((d) => ({
      ...d,
      [name]:
        typeof value === 'function'
          ? value(d[name], d)
          : value,
    }));

  // =========================================================
  // REQUIRED DYNAMIQUE
  //
  // f.required peut être :
  //   - un booléen (true/false)
  //   - une fonction (values) => boolean
  //
  // IMPORTANT : ne jamais faire Boolean(f.required) directement,
  // car Boolean(uneFonction) vaut toujours true.
  // =========================================================
  const isFieldRequired = (f) =>
    typeof f.required === 'function'
      ? f.required(draft || {})
      : Boolean(f.required);


// =========================================================
// STATUT
// =========================================================

const safeItems = Array.isArray(items)
  ? items
  : [];

const getStatus = (item) => {
  return String(
    item.statut_publication ?? item.statutPublication ?? 'draft'
  )
    .toLowerCase()
    .trim();
};


// =========================================================
// STATS
// =========================================================

const getStats = () => {
  const total = safeItems.length;

  const published = safeItems.filter((item) => {
    const status = getStatus(item);

    return status === 'published';
  }).length;

  const drafts = safeItems.filter((item) => {
    const status = getStatus(item);

    return (
      status === 'draft' ||
      status === 'brouillon' ||
      status === ''
    );
  }).length;

  const archived = safeItems.filter((item) => {
    const status = getStatus(item);

    return status === 'archived';
  }).length;

  return {
    total,
    published,
    drafts,
    archived
  };
};

const stats = getStats();


  // =========================================================
  // RENDER
  // =========================================================
  return (
    <div className="space-y-6">

      {/* =====================================================
          HEADER
      ====================================================== */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>

          <h1
            className="
              text-3xl
              font-bold
              text-navy
              dark:text-white
              flex
              items-center
              gap-3
            "
          >
            <Icon size={28} className="text-cobalt shrink-0" />
            <span>{title}</span>
          </h1>

          <p
            className="
              text-sm
              text-slate-600
              dark:text-slate-400
              mt-1
            "
          >
            <span
              className="
                font-semibold
                text-navy
                dark:text-white
              "
            >
              {items === null ? '…' : stats.total}
            </span>{' '}
            élément{stats.total > 1 ? 's' : ''}

            {items !== null && (
              <>
                {' • '}

                <span
                  className="
                    font-semibold
                    text-green-600
                    dark:text-green-400
                  "
                >
                  {stats.published}
                </span>{' '}

                publié{stats.published > 1 ? 's' : ''}
              </>
            )}
          </p>

        </div>


        {/* ===================================================
            AJOUTER
        ==================================================== */}

        <Button
          onClick={openCreate}
          className="
            bg-cobalt
            hover:bg-blue-700
            text-white
            font-semibold
            px-6
            py-3
            rounded-lg
            shadow-md
            hover:shadow-lg
            transition
          "
        >
          {t('admin.crud.add')}
        </Button>

      </div>


      {/* =====================================================
          STATS CARDS
      ====================================================== */}

     {/* STATS CARDS */}
<div className="grid gap-4 md:grid-cols-3">
  <div className="p-6 rounded-lg border border-slate-200 dark:border-slate-700 bg-blue-50 dark:bg-slate-800">
    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Total</p>
    <p className="text-3xl font-bold text-navy dark:text-white mt-2">{stats.total}</p>
  </div>
  <div className="p-6 rounded-lg border border-slate-200 dark:border-slate-700 bg-green-50 dark:bg-slate-800">
    <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase">Publiés</p>
    <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{stats.published}</p>
  </div>
  <div className="p-6 rounded-lg border border-slate-200 dark:border-slate-700 bg-amber-50 dark:bg-slate-800">
    <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase">Brouillons</p>
    <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-2">{stats.drafts}</p>
  </div>
  <div className="p-6 rounded-lg border border-slate-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
    <p className="text-xs font-semibold text-gris-600 dark:text-gray-400 uppercase">archivés</p>
    <p className="text-3xl font-bold text-gris-600 dark:text-gray-400 mt-2">{stats.archived}</p>
  </div>
</div>
      {/* =====================================================
          ERROR
      ====================================================== */}

      {error ? (
        <div
          className="
            p-4
            rounded-lg
            bg-red-50
            dark:bg-red-900/20
            border
            border-red-200
            dark:border-red-800
            text-red-700
            dark:text-red-400
            text-sm
            flex
            items-center
            gap-2
          "
        >
          <AlertTriangle size={18} className="shrink-0" />
          {error}
        </div>
      ) : null}


      {/* =====================================================
          TABLE
      ====================================================== */}

      <Card
        className="
          overflow-hidden
          dark:bg-slate-900
        "
      >

        <div className="overflow-x-auto">

          <table
            className="
              w-full
              bg-white
              dark:bg-slate-900
            "
          >

            {/* =================================================
                HEADER
            ================================================== */}

            <thead>

              <tr
                className="
                  bg-slate-50
                  dark:bg-slate-800
                  border-b
                  border-slate-200
                  dark:border-slate-700
                "
              >

                {columns.map((c) => (
                  <th
                    key={c.key}
                    className="
                      px-6
                      py-4
                      text-left
                      text-xs
                      font-semibold
                      text-slate-600
                      dark:text-slate-300
                      uppercase
                      tracking-wide
                    "
                  >
                    {c.label}
                  </th>
                ))}


                <th
                  className="
                    px-6
                    py-4
                    text-right
                    text-xs
                    font-semibold
                    text-slate-600
                    dark:text-slate-300
                    uppercase
                    tracking-wide
                  "
                >
                  {t('admin.crud.actions')}
                </th>

              </tr>

            </thead>


            {/* =================================================
                BODY
            ================================================== */}

            <tbody
              className="
                divide-y
                divide-slate-200
                dark:divide-slate-700
              "
            >

              {/* LOADING */}

              {items === null ? (

                <tr>

                  <td
                    colSpan={columns.length + 1}
                    className="
                      px-6
                      py-12
                      text-center
                      text-slate-500
                      dark:text-slate-400
                    "
                  >

                    <div
                      className="
                        flex
                        flex-col
                        items-center
                        justify-center
                        gap-3
                      "
                    >

                      <div className="text-cobalt">
                        <Loader2 size={36} className="animate-spin" />
                      </div>

                      <p>
                        {t('admin.crud.loading')}
                      </p>

                    </div>

                  </td>

                </tr>


              ) : items.length === 0 ? (

                /* EMPTY */

                <tr>

                  <td
                    colSpan={columns.length + 1}
                    className="
                      px-6
                      py-12
                      text-center
                      text-slate-500
                      dark:text-slate-400
                    "
                  >

                    <p className="text-lg flex items-center justify-center gap-2">
                      <Inbox size={20} />
                      {t('admin.crud.empty')}
                    </p>

                  </td>

                </tr>


              ) : (

                /* DATA */

                items.map((item) => (

                  <tr
                    key={item.id}
                    className="
                      border-b
                      border-slate-100
                      dark:border-slate-700/50
                      bg-white
                      dark:bg-slate-900
                      hover:bg-slate-50/50
                      dark:hover:bg-slate-800/50
                      transition-colors
                    "
                  >

                    {/* =================================================
                        COLONNES
                    ================================================== */}

                    {columns.map((c) => (

                      <td
                        key={c.key}
                        className="
                          px-6
                          py-4
                          text-sm
                          text-slate-900
                          dark:text-white
                        "
                      >

                        {c.render
                          ? c.render(item)
                          : String(
                              item[c.key] ?? ''
                            )}

                      </td>

                    ))}


                    {/* =================================================
                        ACTIONS
                    ================================================== */}

                    <td className="px-6 py-4">

                      <div
                        className="
                          flex
                          items-center
                          justify-end
                          gap-3
                        "
                      >

                        {/* =============================================
                            MODIFIER
                        ============================================== */}

                        <button
                          type="button"
                          onClick={() =>
                            openEdit(item)
                          }
                          className="
                            text-slate-600
                            dark:text-slate-400
                            hover:text-cobalt
                            dark:hover:text-cobalt
                            transition
                            text-lg
                          "
                          title={t('admin.crud.edit')}
                        >
                          <Pencil size={18} />
                        </button>


                        {/* =============================================
                            STATUT
                            
                            IMPORTANT:
                            On affiche ce menu uniquement si
                            onPublish + onArchive existent.
                        ============================================== */}

                        {onPublish && onArchive ? (

                          <div className="relative">

                            <button
                              type="button"
                              onClick={() =>
                                setPubDropdown(
                                  pubDropdown === item.id
                                    ? null
                                    : item.id
                                )
                              }
                              className={cn(
                                'text-lg transition',

                                getStatus(item) === 'public'
                                  ? 'text-green-600 dark:text-green-400'

                                  : getStatus(item) === 'archived'
                                    ? 'text-slate-600 dark:text-slate-400'

                                    : 'text-amber-500 dark:text-amber-400'
                              )}
                              title="Statut de publication"
                            >
                              ●
                            </button>


                            {pubDropdown === item.id ? (

                              <div
                                className="
                                  absolute
                                  top-full
                                  right-0
                                  mt-1
                                  w-40
                                  rounded-lg
                                  border
                                  border-slate-200
                                  dark:border-slate-600
                                  bg-white
                                  dark:bg-slate-800
                                  shadow-lg
                                  z-20
                                  overflow-hidden
                                "
                              >

                                {/* ===================================
                                    PUBLIER
                                ==================================== */}

                                <button
                                  type="button"
                                  disabled={
                                    actionLoadingId === item.id
                                  }
                                  onClick={() =>
                                    doPublish(item.id)
                                  }
                                  className={cn(
                                    `
                                      w-full
                                      px-4
                                      py-2
                                      text-left
                                      text-sm
                                      transition
                                    `,

                                    getStatus(item) === 'public'
                                      ? `
                                          bg-green-50
                                          dark:bg-green-900/20
                                          text-green-700
                                          dark:text-green-400
                                        `
                                      : `
                                          text-slate-700
                                          dark:text-slate-300
                                          hover:bg-slate-50
                                          dark:hover:bg-slate-700
                                        `
                                  )}
                                >

                                  {actionLoadingId === item.id
                                    ? '...'
                                    : '● Publié'}

                                </button>


                                {/* ===================================
                                    ARCHIVER
                                ==================================== */}

                                <button
                                  type="button"
                                  disabled={
                                    actionLoadingId === item.id
                                  }
                                  onClick={() =>
                                    doArchive(item.id)
                                  }
                                  className={cn(
                                    `
                                      w-full
                                      px-4
                                      py-2
                                      text-left
                                      text-sm
                                      transition
                                      border-t
                                      border-slate-200
                                      dark:border-slate-600
                                    `,

                                    getStatus(item) === 'archived'
                                      ? `
                                          bg-slate-50
                                          dark:bg-slate-700
                                          text-slate-700
                                          dark:text-slate-300
                                        `
                                      : `
                                          text-slate-700
                                          dark:text-slate-300
                                          hover:bg-slate-50
                                          dark:hover:bg-slate-700
                                        `
                                  )}
                                >

                                  {actionLoadingId === item.id
                                    ? '...'
                                    : '● Archivé'}

                                </button>

                              </div>

                            ) : null}

                          </div>

                        ) : null}


                        {/* =============================================
                            SUPPRIMER
                        ============================================== */}

                        <button
                          type="button"
                          onClick={() =>
                            remove(item.id)
                          }
                          className="
                            text-red-600
                            dark:text-red-400
                            hover:text-red-700
                            dark:hover:text-red-300
                            transition
                            text-lg
                          "
                          title={t('admin.crud.delete')}
                        >
                          <Trash2 size={18} />
                        </button>

                      </div>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </Card>


      {/* =====================================================
          FORM MODAL
      ====================================================== */}

      {modalOpen && draft ? (

        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-black/30
            dark:bg-black/50
            backdrop-blur-sm
            p-4
          "
          onClick={() => {

            if (!saving) {
              setModalOpen(false);
            }

          }}
        >

          <Card
            className="
              w-full
              max-w-2xl
              max-h-[90vh]
              overflow-y-auto
              p-6
              border-l-4
              border-cobalt
              bg-white
              dark:bg-slate-900
            "
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* =================================================
                HEADER FORM
            ================================================== */}

            <div
              className="
                flex
                items-center
                justify-between
                mb-6
              "
            >

              <h2
                className="
                  text-xl
                  font-bold
                  text-navy
                  dark:text-white
                  flex
                  items-center
                  gap-2
                "
              >

                {editingId
                  ? <Pencil size={20} className="text-cobalt shrink-0" />
                  : <Plus size={20} className="text-cobalt shrink-0" />
                }

                <span>
                  {editingId ? t('admin.crud.modalEdit') : t('admin.crud.modalAdd')}
                  {' — '}
                  {title}
                </span>

              </h2>


              <button
                type="button"
                onClick={() => {

                  if (!saving) {
                    setModalOpen(false);
                  }

                }}
                className="
                  text-slate-500
                  hover:text-slate-700
                  dark:hover:text-slate-300
                  text-2xl
                "
              >
                <X size={22} />
              </button>

            </div>


            {/* =================================================
                FORM
            ================================================== */}

            <form
              onSubmit={save}
              className="space-y-4"
            >

              {fields.map((f) => (

                <div key={f.name}>

                  {/* =================================================
                      LABEL
                  ================================================== */}

                  <label
                    className="
                      block
                      text-sm
                      font-medium
                      text-slate-700
                      dark:text-slate-300
                      mb-2
                    "
                  >

                    {f.label}

                    {isFieldRequired(f) ? (
                      <span className="ml-1 text-red-500">
                        *
                      </span>
                    ) : null}

                  </label>


                  {/* =================================================
                      TEXTAREA
                  ================================================== */}

                  {f.type === 'textarea' ? (

                    <textarea
                      value={
                        draft[f.name] ?? ''
                      }

                      onChange={(e) =>
                        setField(
                          f.name,
                          e.target.value
                        )
                      }

                      rows={3}

                      required={
                        isFieldRequired(f)
                      }

                      className="
                        w-full
                        px-3
                        py-2
                        rounded-lg
                        border
                        border-slate-300
                        dark:border-slate-600
                        bg-white
                        dark:bg-slate-700
                        text-slate-900
                        dark:text-white
                        placeholder:text-slate-400
                        dark:placeholder:text-slate-500
                        focus:border-cobalt
                        focus:ring-1
                        focus:ring-cobalt/30
                        transition
                      "
                    />


                  ) : f.type === 'geocode' ? (

                    /* =================================================
                       GEOCODE
                    ================================================== */

                    <div>

                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={geocoding}
                        onClick={async () => {

                          setGeocoding(true);
                          setGeocodeMsg('');

                          try {

                            const result =
                              await f.onGeocode(
                                draft
                              );

                            setField(
                              'latitude',
                              result.latitude
                            );

                            setField(
                              'longitude',
                              result.longitude
                            );

                            setGeocodeMsg(
                              `Trouvé : ${result.displayName}`
                            );

                          } catch (err) {

                            setGeocodeMsg(
                              err.message ||
                              'Adresse introuvable'
                            );

                          } finally {

                            setGeocoding(
                              false
                            );

                          }
                        }}
                      >
                        {geocoding
                          ? '...'
                          : (
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin size={16} /> Localiser
                            </span>
                          )}
                      </Button>


                      {geocodeMsg ? (

                        <p
                          className="
                            mt-1.5
                            text-xs
                            text-slate-500
                            dark:text-slate-400
                          "
                        >
                          {geocodeMsg}
                        </p>

                      ) : null}


                      {draft.latitude &&
                      draft.longitude ? (

                        <p
                          className="
                            mt-1
                            text-xs
                            text-emerald-600
                            dark:text-emerald-400
                          "
                        >

                          Coordonnées enregistrées :{' '}

                          {Number(
                            draft.latitude
                          ).toFixed(4)}

                          ,{' '}

                          {Number(
                            draft.longitude
                          ).toFixed(4)}

                        </p>

                      ) : null}

                    </div>


                  ) : f.type === 'select' ? (

                    /* =================================================
                       SELECT
                    ================================================== */

                    <select
                      value={
                        draft[f.name] ?? ''
                      }

                      onChange={(e) =>
                        setField(
                          f.name,
                          e.target.value
                        )
                      }

                      required={
                        isFieldRequired(f)
                      }

                      className="
                        w-full
                        min-h-[44px]
                        px-3
                        rounded-lg
                        border
                        border-slate-300
                        dark:border-slate-600
                        bg-white
                        dark:bg-slate-700
                        text-slate-900
                        dark:text-white
                        focus:border-cobalt
                        focus:ring-1
                        focus:ring-cobalt/30
                        transition
                      "
                    >

                      <option value="">
                        {t(
                          'admin.crud.selectPlaceholder'
                        )}
                      </option>


                      {f.options?.map((o) => {

                        const value =
                          typeof o === 'object'
                            ? o.value
                            : o;

                        const label =
                          typeof o === 'object'
                            ? o.label
                            : o;

                        return (
                          <option
                            key={value}
                            value={value}
                          >
                            {label}
                          </option>
                        );

                      })}

                    </select>


                  ) : f.type === 'number' ? (

                    /* =================================================
                       NUMBER
                    ================================================== */

                    <input
                      type="number"

                      value={
                        draft[f.name] ?? 0
                      }

                      onChange={(e) =>
                        setField(
                          f.name,
                          e.target.value
                        )
                      }

                      required={
                        isFieldRequired(f)
                      }

                      className="
                        w-full
                        min-h-[44px]
                        px-3
                        py-2
                        rounded-lg
                        border
                        border-slate-300
                        dark:border-slate-600
                        bg-white
                        dark:bg-slate-700
                        text-slate-900
                        dark:text-white
                        focus:border-cobalt
                        focus:ring-1
                        focus:ring-cobalt/30
                        transition
                      "
                    />


                  ) : f.type === 'file' ? (

                    /* =================================================
                       FILE
                    ================================================== */

                    <div>

                      {draft[f.name] ? (

                        <p
                          className="
                            mb-2
                            truncate
                            text-sm
                            text-slate-500
                            dark:text-slate-400
                          "
                        >

                          {t(
                            'admin.crud.currentFile'
                          )} :{' '}

                          <span
                            className="
                              font-medium
                              text-slate-700
                              dark:text-slate-200
                            "
                          >
                            {draft[f.name]}
                          </span>

                        </p>

                      ) : null}


                      <input
                        type="file"

                        accept={f.accept}

                        /*
                         * Obligatoire uniquement lorsque le champ
                         * n'a pas déjà une valeur.
                         *
                         * Cela permet de modifier un document
                         * sans être obligé de re-uploader le fichier.
                         */
                        required={
                          Boolean(
                            isFieldRequired(f) &&
                            !draft[f.name]
                          )
                        }

                        onChange={(e) => {

                          const file =
                            e.target.files?.[0];

                          if (!file) return;

                          if (f.onFile) {

                            f.onFile(
                              file,
                              setField
                            );

                          }

                        }}

                        className="
                          block
                          w-full
                          text-sm
                          text-slate-600
                          dark:text-slate-300

                          file:mr-3
                          file:rounded-lg
                          file:border-0
                          file:bg-cobalt
                          file:px-3
                          file:py-2
                          file:text-sm
                          file:font-medium
                          file:text-white
                          file:cursor-pointer

                          hover:file:bg-cobalt/90
                        "
                      />

                    </div>


                  ) : (

                    /* =================================================
                       TEXT / DATE / EMAIL / AUTRES
                    ================================================== */

                    <input
                      type={f.type || 'text'}

                      value={
                        draft[f.name] ?? ''
                      }

                      onChange={(e) =>
                        setField(
                          f.name,
                          e.target.value
                        )
                      }

                      required={
                        isFieldRequired(f)
                      }

                      placeholder={
                        f.placeholder ||
                        (
                          f.type === 'list'
                            ? t(
                                'admin.crud.listPlaceholder'
                              )
                            : ''
                        )
                      }

                      className="
                        w-full
                        min-h-[44px]
                        px-3
                        py-2
                        rounded-lg
                        border
                        border-slate-300
                        dark:border-slate-600
                        bg-white
                        dark:bg-slate-700
                        text-slate-900
                        dark:text-white
                        placeholder:text-slate-400
                        dark:placeholder:text-slate-500
                        focus:border-cobalt
                        focus:ring-1
                        focus:ring-cobalt/30
                        transition
                      "
                    />

                  )}


                  {/* =================================================
                      HELP / FORMAT
                  ================================================== */}

                  {f.help ? (

                    <p
                      className="
                        mt-1.5
                        text-xs
                        text-slate-500
                        dark:text-slate-400
                      "
                    >
                      {f.help}
                    </p>

                  ) : null}

                </div>

              ))}


              {/* =================================================
                  ERROR FORM
              ================================================== */}

              {error ? (

                <div
                  className="
                    p-3
                    rounded-lg
                    bg-red-50
                    dark:bg-red-900/20
                    border
                    border-red-200
                    dark:border-red-800
                    text-red-700
                    dark:text-red-400
                    text-sm
                    flex
                    items-center
                    gap-2
                  "
                >
                  <AlertTriangle size={16} className="shrink-0" />
                  {error}
                </div>

              ) : null}


              {/* =================================================
                  BUTTONS
              ================================================== */}

              <div
                className="
                  flex
                  flex-col-reverse
                  sm:flex-row
                  justify-end
                  gap-3
                  pt-4
                "
              >

                <button
                  type="button"

                  onClick={() => {

                    if (!saving) {
                      setModalOpen(false);
                    }

                  }}

                  disabled={saving}

                  className="
                    px-4
                    py-2
                    rounded-lg
                    border
                    border-slate-300
                    dark:border-slate-600
                    text-slate-700
                    dark:text-slate-300
                    hover:bg-slate-50
                    dark:hover:bg-slate-700
                    transition
                    text-sm
                    font-medium
                  "
                >
                  {t('admin.crud.cancel')}
                </button>


                <Button
                  type="submit"
                  disabled={saving}
                  className="
                    px-6
                    py-2
                    bg-cobalt
                    hover:bg-blue-700
                    text-white
                    rounded-lg
                    transition
                    text-sm
                    font-medium
                  "
                >
                  {saving
                    ? '...'
                    : (
                      <span className="inline-flex items-center gap-1.5">
                        {editingId ? <Save size={16} /> : <Plus size={16} />}
                        {editingId ? 'Sauvegarder' : 'Créer'}
                      </span>
                    )
                  }
                </Button>

              </div>

            </form>

          </Card>

        </div>

      ) : null}

    </div>
  );
}