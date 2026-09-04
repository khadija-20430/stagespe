import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getUnreadCount, markAllAsRead } from '../../services/api.js';
import NotificationDropdown from './NotificationDropdown.jsx';

export default function NotificationBell() {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const buttonRef = useRef(null);

    const loadUnreadCount = async () => {
        if (!user) return;
        try {
            const data = await getUnreadCount();
            setUnreadCount(data.count || 0);
        } catch (err) {
            console.error('Erreur chargement compteur:', err);
        }
    };

    useEffect(() => {
        loadUnreadCount();
        const interval = setInterval(loadUnreadCount, 30000);
        return () => clearInterval(interval);
    }, [user]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current && 
                !dropdownRef.current.contains(event.target) &&
                buttonRef.current && 
                !buttonRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead();
            setUnreadCount(0);
            loadUnreadCount();
        } catch (err) {
            console.error('Erreur marquage tout lu:', err);
        }
    };

    const toggleDropdown = () => {
        setIsOpen(prev => !prev);
    };

    return (
        <div className="relative">
            <button
                ref={buttonRef}
                onClick={toggleDropdown}
                className="relative flex items-center justify-center h-10 w-10 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Notifications"
            >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div ref={dropdownRef} className="absolute right-0 top-full mt-2 z-50">
                    <NotificationDropdown 
                        onClose={() => setIsOpen(false)}
                        onCountUpdate={loadUnreadCount}
                    />
                </div>
            )}
        </div>
    );
}