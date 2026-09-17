import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, RotateCw, History, Trash2, School } from 'lucide-react';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';

import {
    getSchoolPresentationsAdmin,
    createSchoolPresentation,
    addSchoolTranslation,
    updateSchoolTranslation,
    replaceSchoolFile,
    getSchoolRevisions,
    updateSchoolVisibilite,
    deleteSchoolPresentation,
    deleteSchoolTranslation,
    getFileUrl,
} from '../../services/api.js';

const LANGUAGES = [
    { value: 1, code: 'fr', label: 'Français' },
    { value: 2, code: 'en', label: 'English' },
    { value: 3, code: 'ar', label: 'العربية' },
];

const formatBytes = (bytes) => {
    if (!bytes) return '—';
    const units = ['o', 'Ko', 'Mo', 'Go'];
    let i = 0;
    let n = Number(bytes);
    while (n >= 1024 && i < units.length - 1) {
        n /= 1024;
        i += 1;
    }
    return `${n.toFixed(i === 0 ? 0 : 1).replace('.', ',')} ${units[i]}`;
};

const getFileName = (path) => {
    if (!path) return 'document';
    try {
        return String(path).split('?')[0].split('/').pop() || 'document';
    } catch {
        return 'document';
    }
};

export default function ManageSchool() {
    const { t } = useTranslation();

    const [presentations, setPresentations] = useState([]);
    const [presentation, setPresentation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeLang, setActiveLang] = useState(LANGUAGES[0].code);
    const [revisions, setRevisions] = useState(null);
    const [savingVisibilite, setSavingVisibilite] = useState(false);
    const [uploading, setUploading] = useState(false);

    const load = () => {
        setLoading(true);
        setError(null);
        getSchoolPresentationsAdmin()
            .then((list) => {
                setPresentations(list);
                if (Array.isArray(list) && list.length > 0) {
                    setPresentation(list[0]);
                } else {
                    setPresentation(null);
                }
            })
            .catch((err) => setError(err.message || t('erreur_chargement_traductions')))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    // ================== CRÉATION ==================
    const handleCreate = async (e) => {
        e.preventDefault();
        const form = new FormData(e.target);
        const lang = LANGUAGES.find((l) => l.code === activeLang);

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('language_id', lang.value);
            formData.append('titre', form.get('titre'));
            formData.append('description', form.get('description'));
            formData.append('visibilite', 'draft');

            const file = form.get('file');
            if (file && file.size > 0) {
                formData.append('file', file);
            } else {
                alert(t('erreur_upload'));
                setUploading(false);
                return;
            }

            await createSchoolPresentation(formData);
            load();
        } catch (err) {
            alert(err.message || t('erreur_chargement_traductions'));
        } finally {
            setUploading(false);
        }
    };

    // ================== VISIBILITÉ ==================
    const toggleVisibilite = async () => {
        if (!presentation) return;
        const next = presentation.visibilite === 'public' ? 'draft' : 'public';
        setSavingVisibilite(true);
        try {
            await updateSchoolVisibilite(presentation.id, next);
            load();
        } catch (err) {
            alert(err.message || t('erreur_enregistrement_traductions'));
        } finally {
            setSavingVisibilite(false);
        }
    };

    // ================== TRADUCTIONS ==================
    const currentTranslation = presentation?.translations?.find(
        (tr) => tr.language_code === activeLang
    );

    const handleAddTranslation = async (e) => {
        e.preventDefault();
        const form = new FormData(e.target);
        const lang = LANGUAGES.find((l) => l.code === activeLang);

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('language_id', lang.value);
            formData.append('titre', form.get('titre'));
            formData.append('description', form.get('description'));

            const file = form.get('file');
            if (file && file.size > 0) {
                formData.append('file', file);
            } else {
                alert(t('erreur_upload'));
                setUploading(false);
                return;
            }

            await addSchoolTranslation(presentation.id, formData);
            load();
        } catch (err) {
            alert(err.message || t('erreur_enregistrement_traductions'));
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateTranslation = async (e) => {
        e.preventDefault();
        const form = new FormData(e.target);
        try {
            await updateSchoolTranslation(currentTranslation.id, {
                titre: form.get('titre'),
                description: form.get('description'),
            });
            load();
        } catch (err) {
            alert(err.message || t('erreur_enregistrement_traductions'));
        }
    };

    const handleReplaceFile = async (file) => {
        if (!file) return;
        setUploading(true);
        try {
            await replaceSchoolFile(currentTranslation.id, file);
            load();
        } catch (err) {
            alert(err.message || t('erreur_upload'));
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteTranslation = async () => {
        const langLabel = LANGUAGES.find((l) => l.code === activeLang).label;
        if (!window.confirm(`${t('traductions')} ${langLabel} ?`)) return;
        try {
            await deleteSchoolTranslation(currentTranslation.id);
            load();
        } catch (err) {
            alert(err.message || t('erreur_chargement_traductions'));
        }
    };

    const handleShowRevisions = async () => {
        if (revisions) {
            setRevisions(null);
            return;
        }
        try {
            const data = await getSchoolRevisions(currentTranslation.id);
            setRevisions(data);
        } catch (err) {
            alert(err.message || t('erreur_chargement_traductions'));
        }
    };

    const handleDeletePresentation = async () => {
        if (!window.confirm(t('admin.crud.confirmDelete'))) return;
        try {
            await deleteSchoolPresentation(presentation.id);
            load();
        } catch (err) {
            alert(err.message || t('erreur_chargement_traductions'));
        }
    };

    // ================== RENDU ==================
    if (loading) return <p className="p-6 text-slate-500">{t('admin.crud.loading')}</p>;
    if (error) return <p className="p-6 text-red-600">{error}</p>;

    return (
        <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
                    <School size={24} className="text-cobalt" />
                    {t('presentationEcole')}
                </h1>

                {presentation && (
                    <div className="flex items-center gap-3">
                        <Badge tone={presentation.visibilite === 'public' ? 'green' : 'amber'}>
                            {presentation.visibilite === 'public' ? t('published') : t('draft')}
                        </Badge>
                        <Button onClick={toggleVisibilite} disabled={savingVisibilite}>
                            {presentation.visibilite === 'public' ? t('statut_archive') : t('published')}
                        </Button>
                        <Button tone="danger" onClick={handleDeletePresentation}>
                            {t('admin.crud.delete')}
                        </Button>
                    </div>
                )}
            </div>

            {/* Onglets langue */}
            <div className="mb-6 flex gap-2 border-b border-slate-200">
                {LANGUAGES.map((lang) => (
                    <button
                        key={lang.code}
                        onClick={() => { setActiveLang(lang.code); setRevisions(null); }}
                        className={`px-4 py-2 text-sm font-medium transition ${
                            activeLang === lang.code
                                ? 'border-b-2 border-cobalt text-cobalt'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {lang.label}
                    </button>
                ))}
            </div>

            {!presentation && (
                <Card className="max-w-xl p-6">
                    <p className="mb-4 text-slate-500">
                        {t('school.noContent')}
                    </p>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">{t('titre')} *</label>
                            <input name="titre" placeholder={t('titre')} required className="w-full rounded border px-3 py-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">{t('description')} *</label>
                            <textarea name="description" placeholder={t('description')} rows={4} required className="w-full rounded border px-3 py-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">{t('fichier')} *</label>
                            <input name="file" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" required className="w-full" />
                        </div>
                        <Button type="submit" disabled={uploading}>
                            {uploading ? t('admin.crud.loading') : t('admin.crud.create')}
                        </Button>
                    </form>
                </Card>
            )}

            {presentation && !currentTranslation && (
                <Card className="max-w-xl p-6">
                    <p className="mb-4 text-slate-500">
                        {t('traductions')} - {LANGUAGES.find((l) => l.code === activeLang).label}
                    </p>
                    <form onSubmit={handleAddTranslation} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">{t('titre')} *</label>
                            <input name="titre" placeholder={t('titre')} required className="w-full rounded border px-3 py-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">{t('description')} *</label>
                            <textarea name="description" placeholder={t('description')} rows={4} required className="w-full rounded border px-3 py-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">{t('fichier')} *</label>
                            <input name="file" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" required className="w-full" />
                        </div>
                        <Button type="submit" disabled={uploading}>
                            {uploading ? t('admin.crud.loading') : t('admin.crud.modalAdd')}
                        </Button>
                    </form>
                </Card>
            )}

            {presentation && currentTranslation && (
                <div className="max-w-2xl space-y-6">
                    <Card className="p-6">
                        <form onSubmit={handleUpdateTranslation} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">{t('titre')} *</label>
                                <input
                                    name="titre"
                                    defaultValue={currentTranslation.titre}
                                    required
                                    className="w-full rounded border px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">{t('description')} *</label>
                                <textarea
                                    name="description"
                                    defaultValue={currentTranslation.description}
                                    rows={4}
                                    required
                                    className="w-full rounded border px-3 py-2"
                                />
                            </div>
                            <Button type="submit">{t('admin.crud.save')}</Button>
                        </form>
                    </Card>

                    <Card className="p-6">
                        <p className="mb-2 text-sm text-slate-500">
                            {t('fichier')} : {getFileName(currentTranslation.fichier_url)} · {formatBytes(currentTranslation.file_size)} · {currentTranslation.file_format?.toUpperCase()}
                        </p>
                        <div className="flex flex-wrap items-center gap-3">
                            <a
                                href={getFileUrl(currentTranslation.fichier_url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-cobalt hover:text-blue-700"
                            >
                                <Eye size={16} /> {t('voir')}
                            </a>
                            <label className="inline-flex items-center gap-1.5 cursor-pointer text-green-600 hover:text-green-700">
                                <RotateCw size={16} /> {t('telecharger')}
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                                    className="hidden"
                                    onChange={(e) => handleReplaceFile(e.target.files[0])}
                                />
                            </label>
                            <button onClick={handleShowRevisions} className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-700">
                                <History size={16} /> {t('adminAuditLog')}
                            </button>
                            <button onClick={handleDeleteTranslation} className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-700">
                                <Trash2 size={16} /> {t('admin.crud.delete')}
                            </button>
                        </div>

                        {revisions && (
                            <div className="mt-4 border-t pt-3">
                                {revisions.length === 0 && <p className="text-sm text-slate-400">{t('aucun_fichier')}</p>}
                                <ul className="space-y-2">
                                    {revisions.map((rev) => (
                                        <li key={rev.id} className="text-sm text-slate-500">
                                            {getFileName(rev.fichier_url)} · {formatBytes(rev.file_size)} · {t('admin.crud.modalEdit')} {rev.replaced_by_name || '—'} {t('date')} {new Date(rev.replaced_at).toLocaleString('fr-FR')}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </Card>
                </div>
            )}
        </div>
    );
}