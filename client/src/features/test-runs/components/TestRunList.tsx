'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PlusIcon, PlayIcon } from '@heroicons/react/24/outline';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Spinner } from '@/shared/components/ui/Spinner';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { PageHeader } from '@/shared/components/PageHeader';
import { CreateTestRunModal } from './CreateTestRunModal';
import { useTestRuns } from '@/features/test-runs/hooks/useTestRuns';
import { RunStatus } from '@/shared/types';

interface TestRunListProps {
  projectId: string;
}

export function TestRunList({ projectId }: TestRunListProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { data: runs, isLoading, isError } = useTestRuns(projectId);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div>
      <PageHeader
        title="Test Runs"
        description="Execute and track test runs for this project"
        actions={
          <Button variant="primary" size="md" leftIcon={<PlusIcon className="h-4 w-4" />} onClick={() => setIsCreateOpen(true)}>
            New Test Run
          </Button>
        }
      />

      <div className="px-8 py-6">
        {isLoading && (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        )}

        {isError && (
          <div className="bg-red-50 text-red-700 rounded-lg p-4 text-sm border border-red-100">
            Failed to load test runs.
          </div>
        )}

        {!isLoading && !isError && runs?.length === 0 && (
          <EmptyState
            title="No test runs yet"
            description="Create your first test run to start executing tests."
            actionLabel="New Test Run"
            onAction={() => setIsCreateOpen(true)}
          />
        )}

        {!isLoading && !isError && runs && runs.length > 0 && (
          <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] overflow-hidden">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr className="bg-gray-50/70">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Run Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sprint / Version</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cases</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                  <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {runs.map((run) => (
                  <tr key={run.id} className="hover:bg-gray-50/60 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{run.name}</p>
                      {run.description && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{run.description}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={run.status}>{run.status.replace('_', ' ')}</Badge>
                    </td>
                    {/* Sprint / Version badges */}
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {run.sprint ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700 ring-1 ring-primary-200">
                            {run.sprint}
                          </span>
                        ) : null}
                        {run.version ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700 ring-1 ring-sky-200">
                            {run.version}
                          </span>
                        ) : null}
                        {!run.sprint && !run.version && (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {run._count?.results ?? 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(run.createdAt)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(run.completedAt)}</td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/projects/${projectId}/runs/${run.id}`}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-600 transition-colors"
                      >
                        <PlayIcon className="h-4 w-4" />
                        {run.status === RunStatus.COMPLETED ? 'View' : 'Execute'}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateTestRunModal projectId={projectId} isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
}
