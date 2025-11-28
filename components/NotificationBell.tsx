import React, { useState, useEffect } from 'react';
import { AppNotification } from '../types';
import { Bell } from './icons';

interface NotificationBellProps {
  notifications: AppNotification[];
  onOpen: () => void;
}

// A simple utility to format time differences
const timeAgo = (dateString: string): string => {
    const now = new Date();
    const past = new Date(dateString);
    const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return Math.floor(seconds) + "s ago";
};

const NotificationBell: React.FC<NotificationBellProps> = ({ notifications, onOpen }) => {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const handleToggle = () => {
    setIsOpen(prev => {
        if (!prev) { // If it's about to open
            onOpen();
        }
        return !prev;
    });
  };
  
  // Close dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && event.target && (event.target as HTMLElement).closest('.notification-bell-wrapper') === null) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative notification-bell-wrapper">
      <button 
        onClick={handleToggle}
        className="relative p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
        aria-label="Toggle notifications"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-4 w-4 flex items-center justify-center text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-20">
          <div className="p-3 font-semibold text-sm border-b border-gray-200 dark:border-gray-700">Notifications</div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map(notif => (
                <div key={notif.id} className={`p-3 border-b border-gray-100 dark:border-gray-700/50 ${!notif.read ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
                  <p className="text-sm text-gray-700 dark:text-gray-200">{notif.message}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{timeAgo(notif.createdAt)}</p>
                </div>
              ))
            ) : (
              <p className="p-4 text-sm text-center text-gray-500 dark:text-gray-400">No notifications</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
