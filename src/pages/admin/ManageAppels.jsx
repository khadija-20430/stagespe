// ManageAppels.jsx - avec gestion des relations
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Megaphone, Languages, X, Save, Loader2 } from 'lucide-react';
import CrudManager from './CrudManager.jsx';
import Badge from '../../components/ui/Badge.jsx';
import {
  getAppelsAdmin, getAppelsAdminPreview, createAppel, updateAppel, deleteAppel,
  publishAppel, archiveAppel,
  getProgrammes, getActionTypes, getCountries, getThemes,
  getCallTranslations, updateCallTranslations,
} from '../../services/api.js';
import { toAppelPayload } from '../../services/mappers.js';
import { CALL_STATUS, callStatusTone } from '../../lib/enums.js';

const publicationStatusTone = (s) => (s === 'published' ? 'green' : s === 'archived' ? 'slate' : 'amber');

const TRANSLATION_FIELDS = [
  { name: 'title', label: 'Titre' },
  { name: 'description', label: 'Description' },
  { name: 'objectives', label: 'Objectifs' },
  { name: 'eligibility', label: 'Éligibilité' },
  { name: 'beneficiaries', label: 'Bénéficiaires' },
];

const emptyTranslationSet = () => ({
  en: { title: '', description: '', objectives: '', eligibility: '', beneficiaries: '' },
  ar: { title: '', description: '', objectives: '', eligibility: '', beneficiaries: '' },
});

export default function ManageAppels() {
  const { t, i18n } = useTranslation();
  const previewLang = i18n.language;

  const [programmes, setProgrammes] = useState([]);
  const [actionTypes, setActionTypes] = useState([]);
  const [countries, setCountries] = useState([]);
  const [themes, setThemes] = useState([]);
  const [previewData, setPreviewData] = useState({});

  // ---- Modale de traduction manuelle ----
  const [translationsItem, setTranslationsItem] = useState(null);
  const [translationsDraft, setTranslationsDraft] = useState(emptyTranslationSet());
  const [translationsTab, setTranslationsTab] = useState('en');
  const [translationsLoading, setTranslationsLoading] = useState(false);
  const [translationsSaving, setTranslationsSaving] = useState(false);
  const [translationsError, setTranslationsError] = useState('');

  useEffect(() => {
    getProgrammes().then(setProgrammes);
    getActionTypes().then(setActionTypes);
    getCountries(previewLang).then(setCountries);
    getThemes(previewLang).then(setThemes);
  }, [previewLang]);

  const refreshPreview = () => {
    if (previewLang === 'fr') return;
    getAppelsAdminPreview(previewLang).then((rows) => {
      const map = {};
      rows.forEach((r) => { map[r.id] = r; });
      setPreviewData(map);
    });
  };

  useEffect(() => {
    if (previewLang === 'fr') {
      setPreviewData({});
      return;
    }
    refreshPreview();
  }, [previewLang]);

  const openTranslations = async (item) => {
    setTranslationsItem(item);
    setTranslationsTab('en');
    setTranslationsError('');
    setTranslationsLoading(true);
    setTranslationsDraft(emptyTranslationSet());

    try {
      const existing = await getCallTranslations(item.id);
      setTranslationsDraft((prev) => ({
        en: { ...prev.en, ...(existing.en || {}) },
        ar: { ...prev.ar, ...(existing.ar || {}) },
      }));
    } catch (err) {
      setTranslationsError(err.message || 'Erreur de chargement des traductions');
    } finally {
      setTranslationsLoading(false);
    }
  };

  const closeTranslations = () => {
    if (translationsSaving) return;
    setTranslationsItem(null);
  };

  const setTranslationField = (lang, field, value) => {
    setTranslationsDraft((prev) => ({
      ...prev,
      [lang]: { ...prev[lang], [field]: value },
    }));
  };

  const saveTranslations = async () => {
    setTranslationsSaving(true);
    setTranslationsError('');

    try {
      await updateCallTranslations(translationsItem.id, translationsDraft);
      refreshPreview();
      setTranslationsItem(null);
    } catch (err) {
      setTranslationsError(err.message || "Erreur lors de l'enregistrement");
    } finally {
      setTranslationsSaving(false);
    }
  };

  return (
    <div>
      <CrudManager
        title={t('admin.nav.calls')}
        icon={Megaphone}
        idPrefix="app"
        fetcher={getAppelsAdmin}
        toPayload={toAppelPayload}
        onCreate={createAppel}
        onUpdate={updateAppel}
        onDelete={deleteAppel}
        onPublish={publishAppel}
        onArchive={archiveAppel}
        createPermission="calls.create"
        updatePermission="calls.edit"
        deletePermission="calls.delete"
        publishPermission="calls.publish"
        columns={[
          { key: 'titre', label: t('titre'), required: true,
            render: (i) => previewData[i.id]?.titre || i.titre },
          { key: 'programme', label: t('programme'), render: (i) => <Badge tone="cobalt">{i.programme}</Badge> },
          { key: 'themes', label: t('themes'),
            render: (i) => (previewData[i.id]?.themeNames ?? i.themeNames ?? []).join(', ') || '—' },
          { key: 'eligibility', label: t('pays'),
            render: (i) => (previewData[i.id]?.paysEligibles ?? i.paysEligibles ?? []).join(', ') || '—' },
          { key: 'status', label: t('status'),
            render: (i) => <Badge tone={callStatusTone(i.status)}>{t(`${i.status}`)}</Badge> },
          { key: 'dateLimite', label: t('dateLimite'),
            render: (i) => i.dateLimite ? new Date(i.dateLimite).toLocaleDateString('fr-FR') : '—' },
          { key: 'statut_publication', label: t('statutPublication'),
            render: (i) => <Badge tone={publicationStatusTone(i.statut_publication)}>{t(`${i.statut_publication}`)}</Badge> },
          { key: 'translations', label: t('traductions'),
            render: (i) => (
              <button
                type="button"
                onClick={() => openTranslations(i)}
                className="text-slate-500 hover:text-cobalt dark:text-slate-400 dark:hover:text-cobalt transition"
                title="Voir / modifier les traductions"
              >
                <Languages size={18} />
              </button>
            ) },
        ]}
        fields={[
          { name: 'titre', label: t('titre'), type: 'text', required: true },
          { name: 'programmeId', label: t('programme'), type: 'select',
            options: programmes.map((p) => ({ value: p.id, label: p.name })) },
          { name: 'organismeFinanceur', label: t('organismeFinanceur'), type: 'text' },
          { name: 'paysEligiblesIds', label: t('pays'), type: 'multiselect',
            options: countries.map((c) => ({ value: c.id, label: c.name })) },
          { name: 'themeIds', label: t('themes'), type: 'multiselect',
            options: themes.map((th) => ({ value: th.id, label: th.name })) },
          { name: 'typeActionId', label: t('typeAction'), type: 'select',
            options: actionTypes.map((a) => ({ value: a.id, label: a.label })) },
          // ⚠️ Champ "status" retiré : calculé automatiquement par le backend (trigger DB
          //    à partir de publication_date / deadline), l'admin ne le choisit plus.
          { name: 'datePublication', label: t('datePublication'), type: 'date' },
          { name: 'dateLimite', label: t('dateLimite'), type: 'date' },
          { name: 'budgetDisponible', label: t('budget'), type: 'number' },
          { name: 'tauxFinancement', label: t('tauxFinancement'), type: 'number' },
          { name: 'publicCible', label: t('publicCible'), type: 'text' },
          { name: 'lienOfficiel', label: t('lienOfficiel'), type: 'text' },
          { name: 'personneContact', label: t('personneContact'), type: 'text' },
          { name: 'resume', label: t('resume'), type: 'textarea' },
        ]}
      />

      {/* MODALE DE TRADUCTION */}
      {translationsItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl">
            {/* ... contenu de la modale ... */}
          </div>
        </div>
      )}
    </div>
  );
}