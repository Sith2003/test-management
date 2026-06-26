'use client';

import { useState } from 'react';
import {
  PlusIcon,
  TrashIcon,
  LinkIcon,
  MagnifyingGlassIcon,
  PaperClipIcon,
} from '@heroicons/react/24/outline';
import { PageHeader } from '@/shared/components/PageHeader';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Spinner } from '@/shared/components/ui/Spinner';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Pagination } from '@/shared/components/ui/Pagination';
import {
  useRequirements,
  useDeleteRequirement,
  useRequirementCoverage,
} from '../hooks/useRequirements';
import { CreateRequirementModal } from './CreateRequirementModal';
import { LinkTestCasesModal } from './LinkTestCasesModal';
import { RequirementDocumentsModal } from './RequirementDocumentsModal';
import { LinkedTestCasesModal } from './LinkedTestCasesModal';
import { Priority } from '@/shared/types';
import type { Requirement } from '@/shared/types';
import { TH, TD } from '@/shared/constants/table';

interface RequirementListProps {
  projectId: string;
}

const PRIORITY_FILTER_OPTIONS: Array<{ label: string; value: Priority | 'ALL' }> = [
  { label: 'All Priorities', value: 'ALL' },
  { label: 'Critical', value: Priority.CRITICAL },
  { label: 'High', value: Priority.HIGH },
  { label: 'Medium', value: Priority.MEDIUM },
  { label: 'Low', value: Priority.LOW },
];

export function RequirementList({ projectId }: RequirementListProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'ALL'>('ALL');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [linkTarget, setLinkTarget] = useState<Requirement | null>(null);
  const [docsTarget, setDocsTarget] = useState<Requirement | null>(null);
  const [viewLinkedTarget, setViewLinkedTarget] = useState<Requirement | null>(null);

  const params: Record<string, string> = { page: String(page) };
  if (search.trim()) params.search = search.trim();
  if (priorityFilter !== 'ALL') params.priority = priorityFilter;

  const { data, isLoading, isError } = useRequirements(projectId, params);
  const { data: coverage } = useRequirementCoverage(projectId);
  const deleteRequirement = useDeleteRequirement(projectId);

  const requirements: Requirement[] = data?.data ?? [];
  const pagination = data?.pagination;

  const handleDelete = (req: Requirement) => {
    if (window.confirm(`Delete requirement "${req.title}"? This action cannot be undone.`)) {
      deleteRequirement.mutate(req.id);
    }
  };

  return (
    <div>
      <PageHeader
        title="Requirements"
        description="Track and link requirements to test cases"
        actions={
          <Button
            variant="primary"
            size="md"
            leftIcon={<PlusIcon className="h-4 w-4" />}
            onClick={() => setIsCreateOpen(true)}
          >
            New Requirement
          </Button>
        }
      />

      <div className="px-8 py-6">
        {/* Coverage summary */}
        {coverage && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] px-5 py-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total</p>
              <p className="text-2xl font-bold text-gray-900">{coverage.total}</p>
            </div>
            <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] px-5 py-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Covered</p>
              <p className="text-2xl font-bold text-primary-600">
                {coverage.covered}
                <span className="text-sm font-normal text-gray-400 ml-1">
                  ({coverage.coveredPercent.toFixed(0)}%)
                </span>
              </p>
            </div>
            <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] px-5 py-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Pass Rate</p>
              <p className="text-2xl font-bold text-green-600">{coverage.passedPercent.toFixed(0)}%</p>
            </div>
          </div>
        )}

        {/* Filters bar */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search requirements..."
              className="pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 w-56 transition-shadow"
            />
          </div>

          {/* Priority filter tabs */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {PRIORITY_FILTER_OPTIONS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => { setPriorityFilter(tab.value); setPage(1); }}
                className={[
                  'px-3 py-1 text-xs font-medium rounded-md transition-colors min-w-[72px] text-center',
                  priorityFilter === tab.value
                    ? 'bg-white text-primary-600 shadow-sm ring-1 ring-gray-900/[0.06]'
                    : 'text-gray-500 hover:text-gray-700',
                ].join(' ')}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-16">
            <Spinner size="lg" className="text-primary-500" />
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] p-6 text-center text-sm text-red-600">
            Failed to load requirements. Please try again.
          </div>
        )}

        {/* Table */}
        {!isLoading && !isError && (
          <>
            <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] overflow-hidden">
              {requirements.length === 0 ? (
                <EmptyState
                  title="No requirements found"
                  description={
                    search || priorityFilter !== 'ALL'
                      ? 'Try adjusting your filters.'
                      : 'Create your first requirement to get started.'
                  }
                  actionLabel={!search && priorityFilter === 'ALL' ? 'New Requirement' : undefined}
                  onAction={!search && priorityFilter === 'ALL' ? () => setIsCreateOpen(true) : undefined}
                />
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50/80 border-b border-gray-100">
                    <tr>
                      <th className={TH}>Req ID</th>
                      <th className={TH}>Title</th>
                      <th className={TH}>External ID</th>
                      <th className={TH}>Priority</th>
                      <th className={TH}>Linked TCs</th>
                      <th className={`${TH} text-right`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {requirements.map((req) => (
                      <tr key={req.id} className="hover:bg-gray-50/60 transition-colors group">
                        {/* Req ID */}
                        <td className={TD}>
                          <span className="font-mono text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                            {req.reqId}
                          </span>
                        </td>

                        {/* Title */}
                        <td className={TD}>
                          <p className="font-medium text-gray-900 max-w-xs truncate">{req.title}</p>
                          {req.description && (
                            <p className="text-xs text-gray-400 truncate max-w-xs mt-0.5">{req.description}</p>
                          )}
                        </td>

                        {/* External ID */}
                        <td className={TD}>
                          <span className="text-gray-500 text-xs">{req.externalId ?? '—'}</span>
                        </td>

                        {/* Priority */}
                        <td className={TD}>
                          <Badge variant={req.priority}>{req.priority}</Badge>
                        </td>

                        {/* Linked TCs */}
                        <td className={TD}>
                          {(() => {
                            const count = req._count?.testCases ?? req.testCases?.length ?? 0;
                            return count > 0 ? (
                              <button
                                onClick={() => setViewLinkedTarget(req)}
                                className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 hover:underline transition-colors"
                              >
                                <span className="font-medium">{count}</span>
                                linked
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                                <span className="font-medium">0</span>
                                linked
                              </span>
                            );
                          })()}
                        </td>

                        {/* Actions */}
                        <td className={`${TD} text-right`}>
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setDocsTarget(req)}
                              className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                              title="Documents"
                            >
                              <PaperClipIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setLinkTarget(req)}
                              className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                              aria-label={`Link test cases to ${req.reqId}`}
                              title="Link Test Cases"
                            >
                              <LinkIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(req)}
                              disabled={deleteRequirement.isPending}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              aria-label={`Delete ${req.reqId}`}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-4">
                <Pagination pagination={pagination} onPageChange={setPage} />
              </div>
            )}
          </>
        )}
      </div>

      <CreateRequirementModal
        projectId={projectId}
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      {linkTarget && (
        <LinkTestCasesModal
          projectId={projectId}
          requirement={linkTarget}
          isOpen={!!linkTarget}
          onClose={() => setLinkTarget(null)}
        />
      )}

      {docsTarget && (
        <RequirementDocumentsModal
          projectId={projectId}
          requirement={docsTarget}
          isOpen={!!docsTarget}
          onClose={() => setDocsTarget(null)}
        />
      )}

      {viewLinkedTarget && (
        <LinkedTestCasesModal
          projectId={projectId}
          requirement={viewLinkedTarget}
          isOpen={!!viewLinkedTarget}
          onClose={() => setViewLinkedTarget(null)}
        />
      )}
    </div>
  );
}
