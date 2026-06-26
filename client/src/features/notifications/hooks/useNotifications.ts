'use client';

import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { notificationService } from '../services/notificationService';
import type { AppNotification } from '@/shared/types';
import api from '@/shared/services/api';

export const notificationKeys = {
  all: ['notifications'] as const,
  unread: ['notifications', 'unread'] as const,
};

export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.all,
    queryFn: () => notificationService.getAll(),
    staleTime: 30_000,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unread,
    queryFn: () => notificationService.getUnreadCount(),
    refetchInterval: 30_000, // poll every 30s as fallback
    staleTime: 10_000,
  });
}

export function useMarkAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
      qc.invalidateQueries({ queryKey: notificationKeys.unread });
    },
  });
}

export function useMarkAllAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
      qc.invalidateQueries({ queryKey: notificationKeys.unread });
    },
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.deleteOne(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
      qc.invalidateQueries({ queryKey: notificationKeys.unread });
    },
  });
}

/** Connects to the SSE stream and refreshes query cache + shows toast on new notification */
export function useSSENotifications() {
  const qc = useQueryClient();
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Get the token from the axios Authorization header
    const authHeader = api.defaults.headers.common['Authorization'] as string | undefined;
    if (!authHeader) return;
    const token = authHeader.replace('Bearer ', '');

    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
    const url = `${baseUrl}/notifications/stream?token=${token}`;

    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (event) => {
      try {
        const notification: AppNotification = JSON.parse(event.data);
        // Refresh caches
        qc.invalidateQueries({ queryKey: notificationKeys.all });
        qc.invalidateQueries({ queryKey: notificationKeys.unread });
        // Show toast
        toast(notification.title, {
          icon: '🔔',
          duration: 4000,
        });
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      es.close();
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
