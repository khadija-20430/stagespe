import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { getNotifications, markAsRead, deleteNotification } from '../../services/api.js';

const typeColors = {
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const typeIcons = {
    info: 'ℹ️',
    warning: '⚠️',
    success: '✅',
    error: '❌',
};
const localeMap = {
    fr: 'fr-FR',
    en: 'en-US',
    ar: 'ar-DZ',
};

export default function NotificationDropdown({ onClose, onCountUpdate, onMarkAllAsRead }) {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(null);
    const [clickingId, setClickingId] = useState(null);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await getNotifications(50);
            setNotifications(data || []);
        } catch (err) {
            console.error('Erreur chargement notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await markAsRead(id);
            setNotifications(prev => prev.map(n => 
                n.id === id ? { ...n, is_read: true } : n
            ));
            if (onCountUpdate) onCountUpdate();
        } catch (err) {
            console.error('Erreur marquage lu:', err);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm(t('notifications.confirmDelete'))) return;
        setDeleting(id);
        try {
            await deleteNotification(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
            if (onCountUpdate) onCountUpdate();
        } catch (err) {
            console.error('Erreur suppression:', err);
        } finally {
            setDeleting(null);
        }
    };

    const formatDate = (date) => {
        try {
            const d = new Date(date);
            const now = new Date();
            const diffMs = now - d;
            const diffSec = Math.floor(diffMs / 1000);
            
            if (diffSec < 5) return t('notifications.time.now');
            if (diffSec < 60) return t('notifications.time.secondsAgo', { count: diffSec });
            
            const diffMin = Math.floor(diffSec / 60);
            if (diffMin < 2) return t('notifications.time.oneMinuteAgo');
            if (diffMin < 60) return t('notifications.time.minutesAgo', { count: diffMin });
            
            const diffHours = Math.floor(diffMin / 60);
            if (diffHours < 2) return t('notifications.time.oneHourAgo');
            if (diffHours < 24) return t('notifications.time.hoursAgo', { count: diffHours });
            
            const diffDays = Math.floor(diffHours / 24);
            if (diffDays < 2) return t('notifications.time.yesterday');
            if (diffDays < 7) return t('notifications.time.daysAgo', { count: diffDays });
            
            return d.toLocaleDateString(localeMap[i18n.language] || 'fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return date;
        }
    };

    const handleNotificationClick = async (notif) => {
        setClickingId(notif.id);
        
        if (!notif.is_read) {
            try {
                await markAsRead(notif.id);
                setNotifications(prev => prev.map(n => 
                    n.id === notif.id ? { ...n, is_read: true } : n
                ));
                if (onCountUpdate) onCountUpdate();
            } catch (err) {
                console.error('Erreur marquage lu:', err);
            }
        }
        
        //  REDIRECTION vers le lien si existant
        if (notif.link) {
            if (onClose) onClose();
            navigate(notif.link);
        }
        
        setTimeout(() => {
            setClickingId(null);
        }, 400);
    };

    const notificationContent = (notif) => (
        <div
            className={`px-4 py-3 border-b border-slate-100 dark:border-slate-700 transition-all duration-300 cursor-pointer ${
                !notif.is_read 
                    ? 'bg-blue-50/70 dark:bg-blue-900/20 border-l-4 border-l-blue-500 hover:bg-blue-100/70 dark:hover:bg-blue-900/40' 
                    : 'opacity-50 hover:opacity-75'
            } ${
                clickingId === notif.id ? 'scale-[0.98] bg-blue-200 dark:bg-blue-900/50' : ''
            }`}
            onClick={() => handleNotificationClick(notif)}
        >
            <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-base ${typeColors[notif.type || 'info']}`}>
                    {typeIcons[notif.type || 'info']}
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-semibold truncate ${
                            !notif.is_read ? 'text-navy dark:text-white' : 'text-slate-500 dark:text-slate-400'
                        }`}>
                            {notif.title}
                        </p>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {!notif.is_read && (
                                <span className="text-[10px] font-bold uppercase text-blue-600 bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded-full animate-pulse">
                                    ● {t('notifications.new')}
                                </span>
                            )}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(notif.id);
                                }}
                                disabled={deleting === notif.id}
                                className="text-slate-400 hover:text-red-500 transition text-sm"
                                title={t('admin.crud.delete')}
                            >
                                {deleting === notif.id ? '...' : '✕'}
                            </button>
                        </div>
                    </div>
                    
                    <p 
                        className={`text-sm mt-0.5 break-words ${
                            !notif.is_read ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'
                        }`}
                        title={notif.message}
                    >
                        {notif.message}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <p className={`text-xs ${
                            !notif.is_read ? 'text-slate-400' : 'text-slate-400/60'
                        }`}>
                            {formatDate(notif.created_at)}
                        </p>
                        {!notif.is_read && (
                            <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="w-96 max-h-[500px] overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl animate-scale-up">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-navy dark:text-white">🔔 {t('notifications.title')}</h3>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">
                        {t('notifications.unreadCount', { count: notifications.filter(n => !n.is_read).length })}
                    </span>
                    {notifications.some(n => !n.is_read) && (
                        <button
                            onClick={async () => {
                                await onMarkAllAsRead();
                                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                            }}
                            className="text-xs text-cobalt hover:underline font-medium"
                        >
                            {t('notifications.markAllRead')}
                        </button>
                    )}
                </div>
            </div>

            {/* Liste */}
            <div className="overflow-y-auto max-h-[400px]">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-cobalt" />
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="py-8 text-center text-slate-400">
                        <p className="text-4xl mb-2">📭</p>
                        <p className="text-sm">{t('notifications.empty')}</p>
                    </div>
                ) : (
                    notifications.map((notif) => (
                        <div key={notif.id}>
                            {notificationContent(notif)}
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
                <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-2 text-center">
                    <button
                        onClick={onClose}
                        className="text-sm text-slate-500 hover:text-cobalt transition"
                    >
                        {t('notifications.close')}
                    </button>
                </div>
            )}
        </div>
    );
}