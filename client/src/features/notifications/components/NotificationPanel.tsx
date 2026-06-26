'use client';

import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { BellIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
  useSSENotifications,
} from '../hooks/useNotifications';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { data: unreadCount = 0 } = useUnreadCount();
  const { data: notifications = [], isLoading } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotif = useDeleteNotification();

  // Connect SSE
  useSSENotifications();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const handleClick = (id: string, link: string | null, isRead: boolean) => {
    if (!isRead) markAsRead.mutate(id);
    if (link) {
      router.push(link);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="relative flex items-center justify-center w-8 h-8 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
        title="Notifications"
      >
        {unreadCount > 0 ? (
          <BellSolidIcon className="h-4 w-4 text-primary-400" />
        ) : (
          <BellIcon className="h-4 w-4" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl ring-1 ring-gray-900/10 z-50 flex flex-col max-h-[480px]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead.mutate()}
                  className="text-[11px] text-primary-600 hover:text-primary-700 font-medium flex items-center gap-0.5"
                  title="Mark all as read"
                >
                  <CheckIcon className="h-3 w-3" /> All read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="ml-2 p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="py-8 text-center text-sm text-gray-400">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center">
                <BellIcon className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No notifications yet</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className={clsx(
                      'flex items-start gap-3 px-4 py-3 transition-colors',
                      n.link ? 'cursor-pointer hover:bg-gray-50' : '',
                      !n.isRead && 'bg-primary-50/40',
                    )}
                    onClick={() => handleClick(n.id, n.link, n.isRead)}
                  >
                    {/* Unread dot */}
                    <span className={clsx(
                      'mt-1.5 h-2 w-2 rounded-full shrink-0',
                      n.isRead ? 'bg-transparent' : 'bg-primary-500',
                    )} />

                    <div className="flex-1 min-w-0">
                      <p className={clsx(
                        'text-xs leading-snug',
                        n.isRead ? 'text-gray-600 font-normal' : 'text-gray-900 font-medium',
                      )}>
                        {n.title}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-gray-300 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); deleteNotif.mutate(n.id); }}
                      className="shrink-0 p-1 rounded text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors"
                      title="Dismiss"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
