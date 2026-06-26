'use client';

import { useActivity } from '../hooks/useActivity';
import { Spinner } from '@/shared/components/ui/Spinner';
import type { ActivityLog } from '@/shared/types';

interface ActivityFeedProps {
  projectId: string;
  limit?: number;
  entityType?: string;
}

const ACTION_LABELS: Record<string, string> = {
  CREATED: 'created',
  UPDATED: 'updated',
  DELETED: 'deleted',
  STATUS_CHANGED: 'changed status of',
  REVIEW_SUBMITTED: 'submitted for review',
  REVIEW_APPROVED: 'approved',
  REVIEW_REJECTED: 'rejected',
};

const ENTITY_LABELS: Record<string, string> = {
  TEST_CASE: 'Test Case',
  DEFECT: 'Defect',
  TEST_RUN: 'Test Run',
};

const ACTION_COLORS: Record<string, string> = {
  CREATED: 'bg-green-100 text-green-700',
  UPDATED: 'bg-blue-100 text-blue-700',
  DELETED: 'bg-red-100 text-red-700',
  STATUS_CHANGED: 'bg-yellow-100 text-yellow-700',
  REVIEW_SUBMITTED: 'bg-primary-100 text-primary-700',
  REVIEW_APPROVED: 'bg-green-100 text-green-700',
  REVIEW_REJECTED: 'bg-red-100 text-red-700',
};

const ENTITY_DOT_COLORS: Record<string, string> = {
  TEST_CASE: 'bg-primary-400',
  DEFECT: 'bg-red-400',
  TEST_RUN: 'bg-blue-400',
};

function groupByDate(items: ActivityLog[]) {
  const groups: Record<string, ActivityLog[]> = {};
  for (const item of items) {
    const date = new Date(item.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    if (!groups[date]) groups[date] = [];
    groups[date].push(item);
  }
  return Object.entries(groups);
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export function ActivityFeed({ projectId, limit, entityType }: ActivityFeedProps) {
  const { data, isLoading } = useActivity(projectId, { limit, entityType });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="md" />
      </div>
    );
  }

  const items = data?.data ?? [];

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-gray-400">
        No activity recorded yet.
      </div>
    );
  }

  const groups = groupByDate(items);

  return (
    <div className="space-y-4">
      {groups.map(([date, logs]) => (
        <div key={date}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            {date}
          </p>
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="flex gap-3 items-start">
                <div className="mt-1.5 flex-shrink-0">
                  <div
                    className={`w-2 h-2 rounded-full ${ENTITY_DOT_COLORS[log.entityType] ?? 'bg-gray-400'}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 leading-snug">
                    <span className="font-medium text-gray-900">{log.user?.name ?? 'Someone'}</span>
                    {' '}
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${ACTION_COLORS[log.action] ?? 'bg-gray-100 text-gray-600'}`}
                    >
                      {ACTION_LABELS[log.action] ?? log.action.toLowerCase()}
                    </span>
                    {' '}
                    <span className="text-xs text-gray-500">{ENTITY_LABELS[log.entityType]}</span>
                    {' '}
                    <span className="font-medium text-gray-800 truncate">{log.entityName}</span>
                  </p>
                  {log.diff && log.action === 'STATUS_CHANGED' && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {String(log.diff.from)} → {String(log.diff.to)}
                    </p>
                  )}
                </div>
                <span className="flex-shrink-0 text-xs text-gray-400 mt-0.5">
                  {timeAgo(log.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
