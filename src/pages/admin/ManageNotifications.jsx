import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Trash2, CheckCircle, Send, User, AlertCircle, Info, Check, X, Filter, Search, Users, Eye } from 'lucide-react';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { getToken } from '../../services/api.js';

const API = import.meta.env.VITE_API_URL;

async function apiFetch(path, options = {}) {
    const res = await fetch(`${API}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`,
            ...(options.headers || {}),
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
        const err = new Error(data?.error || `Erreur ${res.status}`);
        err.status = res.status;
        throw err;
    }
    return data;
}

const typeColors = {
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const typeIcons = {
    info: <Info size={16} />,
    success: <Check size={16} />,
    warning: <AlertCircle size={16} />,
    error: <X size={16} />,
};

export default function ManageNotifications() {
    const { t } = useTranslation();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sendMode, setSendMode] = useState('single');
    const [formData, setFormData] = useState({
        user_id: '',
        role_id: '',
        title: '',
        message: '',
        type: 'info',
        link: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const loadNotifications = async () => {
        setLoading(true);
        try {
            const data = await apiFetch('/notifications/admin/all');
            setNotifications(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async () => {
        try {
            const data = await apiFetch('/auth/users');
            setUsers(data);
        } catch (err) {
            console.error('Erreur chargement utilisateurs:', err);
        }
    };

    const loadRoles = async () => {
        try {
            const data = await apiFetch('/roles');
            setRoles(data);
        } catch (err) {
            console.error('Erreur chargement rôles:', err);
        }
    };

    useEffect(() => {
        loadNotifications();
        loadUsers();
        loadRoles();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm(t('admin.notifications.deleteConfirm'))) return;
        try {
            await apiFetch(`/notifications/${id}`, { method: 'DELETE' });
            await loadNotifications();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await apiFetch(`/notifications/${id}/read`, { method: 'PUT' });
            await loadNotifications();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            if (sendMode === 'role') {
                await apiFetch('/notifications/admin/by-role', {
                    method: 'POST',
                    body: {
                        role_id: parseInt(formData.role_id),
                        title: formData.title,
                        message: formData.message,
                        type: formData.type,
                        link: formData.link || null
                    },
                });
            } else {
                await apiFetch('/notifications/admin', {
                    method: 'POST',
                    body: {
                        user_id: parseInt(formData.user_id),
                        title: formData.title,
                        message: formData.message,
                        type: formData.type,
                        link: formData.link || null
                    },
                });
            }
            setShowCreateModal(false);
            setFormData({ user_id: '', role_id: '', title: '', message: '', type: 'info', link: '' });
            await loadNotifications();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const filteredNotifications = notifications.filter((notif) => {
        if (filterType !== 'all' && notif.type !== filterType) return false;
        if (filterStatus === 'read' && !notif.is_read) return false;
        if (filterStatus === 'unread' && notif.is_read) return false;
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            const titleMatch = notif.title?.toLowerCase().includes(search);
            const messageMatch = notif.message?.toLowerCase().includes(search);
            const userNameMatch = notif.full_name?.toLowerCase().includes(search);
            const emailMatch = notif.email?.toLowerCase().includes(search);
            if (!titleMatch && !messageMatch && !userNameMatch && !emailMatch) return false;
        }
        return true;
    });

    const formatDate = (date) => {
        if (!date) return '—';
        return new Date(date).toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTypeLabel = (type) => {
        const labels = {
            info: t('admin.notifications.filters.info'),
            success: t('admin.notifications.filters.success'),
            warning: t('admin.notifications.filters.warning'),
            error: t('admin.notifications.filters.error')
        };
        return labels[type] || type;
    };

    const total = notifications.length;
    const unread = notifications.filter(n => !n.is_read).length;
    const read = total - unread;

    return (
        <div>
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-navy dark:text-white flex items-center gap-2">
                        <Bell size={24} className="text-cobalt" />
                        {t('admin.notifications.title')}
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {t('admin.notifications.total', { total })} · {t('admin.notifications.unread', { count: unread })} · {t('admin.notifications.read', { count: read })}
                    </p>
                </div>
                <Button onClick={() => setShowCreateModal(true)} className="bg-cobalt hover:bg-blue-700 text-white">
                    <Send size={18} className="mr-1" />
                    {t('admin.notifications.send')}
                </Button>
            </div>

            {/* Filtres */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="flex items-center gap-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5">
                    <Filter size={16} className="text-slate-400" />
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="bg-transparent text-sm text-slate-700 dark:text-slate-300 focus:outline-none py-1"
                    >
                        <option value="all">{t('admin.notifications.filters.allTypes')}</option>
                        <option value="info">{t('admin.notifications.filters.info')}</option>
                        <option value="success">{t('admin.notifications.filters.success')}</option>
                        <option value="warning">{t('admin.notifications.filters.warning')}</option>
                        <option value="error">{t('admin.notifications.filters.error')}</option>
                    </select>
                </div>

                <div className="flex items-center gap-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5">
                    <Eye size={16} className="text-slate-400" />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-transparent text-sm text-slate-700 dark:text-slate-300 focus:outline-none py-1"
                    >
                        <option value="all">{t('admin.notifications.filters.allStatus')}</option>
                        <option value="unread">{t('admin.notifications.filters.unread')}</option>
                        <option value="read">{t('admin.notifications.filters.read')}</option>
                    </select>
                </div>

                <div className="flex-1 min-w-[200px] flex items-center gap-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5">
                    <Search size={16} className="text-slate-400" />
                    <input
                        type="text"
                        placeholder={t('admin.notifications.searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-transparent text-sm text-slate-700 dark:text-slate-300 focus:outline-none w-full py-1"
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-600">
                            <X size={14} />
                        </button>
                    )}
                </div>

                <span className="text-xs text-slate-400">
                    {filteredNotifications.length} résultat(s)
                </span>
            </div>

            {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    {error}
                </div>
            )}

            {/* Liste des notifications */}
            <Card className="overflow-hidden dark:bg-slate-900">
                {loading ? (
                    <div className="p-8 text-center text-slate-400">{t('admin.notifications.loading')}</div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                        <Bell size={48} className="mx-auto mb-3 opacity-30" />
                        <p>{t('admin.notifications.noResults')}</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                        {filteredNotifications.map((notif) => (
                            <div key={notif.id} className={`p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors ${!notif.is_read ? 'bg-blue-50/30 dark:bg-blue-900/10 border-l-4 border-l-cobalt' : ''}`}>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${typeColors[notif.type] || typeColors.info}`}>
                                                {typeIcons[notif.type] || typeIcons.info}
                                                {getTypeLabel(notif.type)}
                                            </span>
                                            {!notif.is_read && (
                                                <Badge tone="cobalt" className="text-[10px]">{t('admin.notifications.status.unread')}</Badge>
                                            )}
                                            <span className="text-xs text-slate-400">
                                                {formatDate(notif.created_at)}
                                            </span>
                                        </div>
                                        <h3 className="text-sm font-semibold text-navy dark:text-white mt-1">
                                            {notif.title}
                                        </h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 break-words">
                                            {notif.message}
                                        </p>
                                        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <User size={12} />
                                                {notif.full_name || 'Utilisateur inconnu'}
                                            </span>
                                            {notif.link && (
                                                <span className="flex items-center gap-1 text-cobalt">
                                                    <span>🔗</span>
                                                    {notif.link}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        {!notif.is_read && (
                                            <button
                                                onClick={() => handleMarkAsRead(notif.id)}
                                                className="p-1.5 text-slate-400 hover:text-cobalt transition rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                title={t('admin.notifications.actions.markAsRead')}
                                            >
                                                <CheckCircle size={18} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(notif.id)}
                                            className="p-1.5 text-slate-400 hover:text-red-600 transition rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                                            title={t('admin.notifications.actions.delete')}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Modal de création */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-navy dark:text-white flex items-center gap-2">
                                <Send size={20} className="text-cobalt" />
                                {t('admin.notifications.modal.title')}
                            </h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Mode d'envoi */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                {t('admin.notifications.modal.sendMode')}
                            </label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setSendMode('single')}
                                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                                        sendMode === 'single'
                                            ? 'bg-cobalt text-white'
                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                    }`}
                                >
                                    <User size={16} className="inline mr-1" />
                                    {t('admin.notifications.modal.singleUser')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSendMode('role')}
                                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                                        sendMode === 'role'
                                            ? 'bg-cobalt text-white'
                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                    }`}
                                >
                                    <Users size={16} className="inline mr-1" />
                                    {t('admin.notifications.modal.groupRole')}
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-4">
                            {/* Sélection utilisateur ou rôle */}
                            {sendMode === 'single' ? (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        {t('admin.notifications.modal.user')}
                                    </label>
                                    <select
                                        value={formData.user_id}
                                        onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                                        required
                                        className="w-full min-h-[40px] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 text-sm text-slate-900 dark:text-white focus:border-cobalt focus:outline-none focus:ring-2 focus:ring-cobalt/30"
                                    >
                                        <option value="">{t('admin.notifications.modal.selectUser')}</option>
                                        {users.map((u) => (
                                            <option key={u.id} value={u.id}>
                                                {u.full_name} ({u.email})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        {t('admin.notifications.modal.role')}
                                    </label>
                                    <select
                                        value={formData.role_id}
                                        onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                                        required
                                        className="w-full min-h-[40px] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 text-sm text-slate-900 dark:text-white focus:border-cobalt focus:outline-none focus:ring-2 focus:ring-cobalt/30"
                                    >
                                        <option value="">{t('admin.notifications.modal.selectRole')}</option>
                                        {roles.map((r) => (
                                            <option key={r.id} value={r.id}>
                                                {r.name} {r.description ? `(${r.description})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="mt-1 text-xs text-slate-400">
                                        {t('admin.notifications.modal.roleHelp')}
                                    </p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    {t('admin.notifications.modal.titleLabel')}
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                    placeholder={t('admin.notifications.modal.titlePlaceholder')}
                                    className="w-full min-h-[40px] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 text-sm text-slate-900 dark:text-white focus:border-cobalt focus:outline-none focus:ring-2 focus:ring-cobalt/30"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    {t('admin.notifications.modal.messageLabel')}
                                </label>
                                <textarea
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    required
                                    rows={3}
                                    placeholder={t('admin.notifications.modal.messagePlaceholder')}
                                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-cobalt focus:outline-none focus:ring-2 focus:ring-cobalt/30"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    {t('admin.notifications.modal.typeLabel')}
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full min-h-[40px] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 text-sm text-slate-900 dark:text-white focus:border-cobalt focus:outline-none focus:ring-2 focus:ring-cobalt/30"
                                >
                                    <option value="info">{t('admin.notifications.filters.info')}</option>
                                    <option value="success">{t('admin.notifications.filters.success')}</option>
                                    <option value="warning">{t('admin.notifications.filters.warning')}</option>
                                    <option value="error">{t('admin.notifications.filters.error')}</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    {t('admin.notifications.modal.linkLabel')}
                                </label>
                                <input
                                    type="text"
                                    value={formData.link}
                                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                    placeholder={t('admin.notifications.modal.linkPlaceholder')}
                                    className="w-full min-h-[40px] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 text-sm text-slate-900 dark:text-white focus:border-cobalt focus:outline-none focus:ring-2 focus:ring-cobalt/30"
                                />
                                <p className="mt-1 text-xs text-slate-400">
                                    {t('admin.notifications.modal.linkHelp')}
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                                <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>
                                    {t('admin.notifications.modal.cancel')}
                                </Button>
                                <Button type="submit" disabled={submitting} className="bg-cobalt hover:bg-blue-700 text-white">
                                    {submitting ? '...' : t('admin.notifications.modal.send')}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}