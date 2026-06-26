'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PlusIcon, CalendarIcon, LinkIcon } from '@heroicons/react/24/outline';
import { PageHeader } from '@/shared/components/PageHeader';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Spinner } from '@/shared/components/ui/Spinner';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { useUatSessions } from '@/features/uat/hooks/useUat';
import { UatSessionStatus } from '@/shared/types';
import { CreateUatSessionModal } from './CreateUatSessionModal';

interface UatSessionListProps {
  projectId: string;
}

type FilterTab = 'ALL' | UatSessionStatus;

const filterTabs: { label: string; value: FilterTab }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Planned', value: UatSessionStatus.PLANNED },
  { label: 'In Progress', value: UatSessionStatus.IN_PROGRESS },
  { label: 'Signed Off', value: UatSessionStatus.SIGNED_OFF },
  { label: 'Rejected', value: UatSessionStatus.REJECTED },
];

function formatDateRange(start: string | null, end: string | null): string | null {
  if (!start && !end) return null;
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  if (start) return `From ${fmt(start)}`;
  return `Until ${fmt(end!)}`;
}

export function UatSessionList({ projectId }: UatSessionListProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('ALL');

  const { data, isLoading, isError } = useUatSessions(projectId);

  const allSessions = data?.data ?? [];
  const filtered =
    activeFilter === 'ALL'
      ? allSessions
      : allSessions.filter((s) => s.status === activeFilter);

  return (
    <div>
      <PageHeader
        title="UAT Test & Sign-Off"
        description="User Acceptance Testing sessions"
        actions={
          <Button
            variant="primary"
            size="md"
            leftIcon={<PlusIcon className="h-4 w-4" />}
            onClick={() => setIsCreateOpen(true)}
          >
            New UAT Session
          </Button>
        }
      />

      <div className="px-8 py-6">
        {/* Filter tabs */}
        <div className="flex items-center gap-1 mb-6 border-b border-gray-100 pb-0">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveFilter(tab.value)}
              className={
                activeFilter === tab.value
                  ? 'px-3 py-2 text-sm font-medium text-primary-600 border-b-2 border-primary-600 -mb-px transition-colors'
                  : 'px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent -mb-px transition-colors'
              }
            >
              {tab.label}
              {tab.value !== 'ALL' && (
                <span className="ml-1.5 text-xs text-gray-400">
                  ({allSessions.filter((s) => s.status === tab.value).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="bg-red-50 text-red-700 rounded-lg p-4 text-sm border border-red-100">
            Failed to load UAT sessions.
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && filtered.length === 0 && (
          <EmptyState
            title={activeFilter === 'ALL' ? 'No UAT sessions yet' : `No ${activeFilter.replace('_', ' ').toLowerCase()} sessions`}
            description={
              activeFilter === 'ALL'
                ? 'Create your first UAT session to start user acceptance testing.'
                : 'Try a different filter or create a new session.'
            }
            actionLabel={activeFilter === 'ALL' ? 'New UAT Session' : undefined}
            onAction={activeFilter === 'ALL' ? () => setIsCreateOpen(true) : undefined}
          />
        )}

        {/* Session grid */}
        {!isLoading && !isError && filtered.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((session) => {
              const dateRange = formatDateRange(session.uatStartDate, session.uatEndDate);
              const resultCount = session._count?.results ?? 0;

              return (
                <div
                  key={session.id}
                  className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] p-5 hover:ring-primary-200 transition-all"
                >
                  {/* Top row: badge + status */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center rounded-md bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-700 ring-1 ring-inset ring-primary-700/10">
                      {session.sessionId}
                    </span>
                    <Badge variant={session.status}>
                      {session.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  {/* Session name */}
                  <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate">
                    {session.name}
                  </h3>

                  {/* Version */}
                  {session.version && (
                    <p className="text-xs text-gray-500 mb-2">
                      <span className="font-medium text-gray-600">v</span>
                      {session.version}
                    </p>
                  )}

                  {/* Date range */}
                  {dateRange && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                      <CalendarIcon className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span>{dateRange}</span>
                    </div>
                  )}

                  {/* Environment URL */}
                  {session.environmentUrl && (
                    <div className="flex items-center gap-1.5 text-xs mb-2 min-w-0">
                      <LinkIcon className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <a
                        href={session.environmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 truncate"
                      >
                        {session.environmentUrl}
                      </a>
                    </div>
                  )}

                  {/* Footer: result count + action */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-500">
                      {resultCount} test {resultCount === 1 ? 'case' : 'cases'}
                    </span>
                    <Link
                      href={`/projects/${projectId}/uat/${session.id}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
                    >
                      View Session
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CreateUatSessionModal
        projectId={projectId}
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
}
