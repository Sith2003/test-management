'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { PlusIcon, TrashIcon, MagnifyingGlassIcon, CheckIcon, BugAntIcon } from '@heroicons/react/24/outline';
import { PageHeader } from '@/shared/components/PageHeader';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Spinner } from '@/shared/components/ui/Spinner';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import {
  useAdhocCases,
  useUpdateAdhocCase,
  useDeleteAdhocCase,
  useConvertAdhocToTc,
  useConvertAdhocToDefect,
} from '@/features/adhoc/hooks/useAdhoc';
import { AdhocStatus } from '@/shared/types';
import type { AdhocCase } from '@/shared/types';
import { CreateAdhocModal } from './CreateAdhocModal';
import { TH, TD } from '@/shared/constants/table';

interface AdhocListProps {
  projectId: string;
}

// Status transitions — RESOLVED is terminal
const adhocTransitions: Record<string, string[]> = {
  OPEN: ['IN_PROGRESS'],
  IN_PROGRESS: ['RESOLVED', 'ESCALATED'],
  ESCALATED: ['IN_PROGRESS', 'RESOLVED'],
  RESOLVED: [],
};

const STATUS_FILTER_TABS: Array<{ label: string; value: AdhocStatus | 'ALL' }> = [
  { label: 'All', value: 'ALL' },
  { label: 'Open', value: AdhocStatus.OPEN },
  { label: 'In Progress', value: AdhocStatus.IN_PROGRESS },
  { label: 'Resolved', value: AdhocStatus.RESOLVED },
  { label: 'Escalated', value: AdhocStatus.ESCALATED },
];

const urgencyClasses: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-800',
  HIGH: 'bg-orange-100 text-orange-800',
  NORMAL: 'bg-gray-100 text-gray-600',
};

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + '…' : str;
}

interface StatusCellProps {
  row: AdhocCase;
  onUpdate: (id: string, status: AdhocStatus) => void;
  isUpdating: boolean;
}

function StatusCell({ row, onUpdate, isUpdating }: StatusCellProps) {
  const transitions = adhocTransitions[row.status] ?? [];

  if (transitions.length === 0) {
    return <Badge variant={row.status}>{row.status}</Badge>;
  }

  return (
    <select
      value={row.status}
      disabled={isUpdating}
      onChange={(e) => onUpdate(row.id, e.target.value as AdhocStatus)}
      className="text-xs rounded border border-gray-200 bg-white px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary-400 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <option value={row.status}>{row.status}</option>
      {transitions.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}

export function AdhocList({ projectId }: AdhocListProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AdhocStatus | 'ALL'>('ALL');

  const { data, isLoading, isError } = useAdhocCases(projectId);
  const updateAdhoc = useUpdateAdhocCase(projectId);
  const deleteAdhoc = useDeleteAdhocCase(projectId);
  const convertToTc = useConvertAdhocToTc(projectId);
  const convertToDefect = useConvertAdhocToDefect(projectId);

  const allCases: AdhocCase[] = data?.data ?? [];

  const filtered = allCases.filter((c) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      q === '' ||
      c.issueDescription.toLowerCase().includes(q) ||
      c.requestor.toLowerCase().includes(q) ||
      (c.module ?? '').toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (id: string, status: AdhocStatus) => {
    updateAdhoc.mutate({ id, input: { status } });
  };

  const handleDelete = (row: AdhocCase) => {
    if (
      window.confirm(
        `Delete ad-hoc case "${row.adhocId}"? This action cannot be undone.`
      )
    ) {
      deleteAdhoc.mutate(row.id);
    }
  };

  const handleConvert = (row: AdhocCase) => {
    if (window.confirm('Convert this ad-hoc case to a test case?')) {
      convertToTc.mutate(row.id);
    }
  };

  const handleConvertToDefect = (row: AdhocCase) => {
    if (
      window.confirm(
        `Convert ad-hoc case "${row.adhocId}" to a defect? This will create a new defect record.`
      )
    ) {
      convertToDefect.mutate(row.id);
    }
  };

  return (
    <div>
      <PageHeader
        title="Ad-Hoc Special Cases"
        description="Special and unplanned test requests"
        actions={
          <Button
            variant="primary"
            size="md"
            leftIcon={<PlusIcon className="h-4 w-4" />}
            onClick={() => setIsCreateOpen(true)}
          >
            New Ad-Hoc Case
          </Button>
        }
      />

      <div className="px-8 py-6">
        {/* Filters bar */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cases..."
              className="pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 w-56 transition-shadow"
            />
          </div>

          {/* Status filter tabs */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {STATUS_FILTER_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={clsx(
                  'px-3 py-1 text-xs font-medium rounded-md transition-colors min-w-[72px] text-center',
                  statusFilter === tab.value
                    ? 'bg-white text-primary-600 shadow-sm ring-1 ring-gray-900/[0.06]'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center py-16">
            <Spinner size="lg" className="text-primary-500" />
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] p-6 text-center text-sm text-red-600">
            Failed to load ad-hoc cases. Please try again.
          </div>
        )}

        {/* Table */}
        {!isLoading && !isError && (
          <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] overflow-hidden">
            {filtered.length === 0 ? (
              <EmptyState
                title={
                  allCases.length === 0
                    ? 'No ad-hoc cases yet'
                    : 'No cases match your filters'
                }
                description={
                  allCases.length === 0
                    ? 'Submit your first ad-hoc case to start tracking special requests.'
                    : 'Try adjusting the search or status filter.'
                }
                actionLabel={allCases.length === 0 ? 'New Ad-Hoc Case' : undefined}
                onAction={allCases.length === 0 ? () => setIsCreateOpen(true) : undefined}
              />
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50/80 border-b border-gray-100">
                  <tr>
                    <th className={TH}>ID</th>
                    <th className={TH}>Issue</th>
                    <th className={TH}>Module</th>
                    <th className={TH}>Requestor</th>
                    <th className={TH}>Urgency</th>
                    <th className={TH}>Status</th>
                    <th className={TH}>Assigned QA</th>
                    <th className={TH}>Converted</th>
                    <th className={`${TH} text-right`}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-gray-50/60 transition-colors group"
                    >
                      {/* ID */}
                      <td className={TD}>
                        <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                          {row.adhocId}
                        </span>
                      </td>

                      {/* Issue */}
                      <td className={TD}>
                        <p
                          className="text-gray-900 max-w-xs"
                          title={row.issueDescription}
                        >
                          {truncate(row.issueDescription, 60)}
                        </p>
                      </td>

                      {/* Module */}
                      <td className={TD}>
                        <span className="text-gray-500">{row.module ?? '—'}</span>
                      </td>

                      {/* Requestor */}
                      <td className={TD}>
                        <span className="text-gray-700">{row.requestor}</span>
                      </td>

                      {/* Urgency */}
                      <td className={TD}>
                        <span
                          className={clsx(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                            urgencyClasses[row.urgency] ?? urgencyClasses.NORMAL
                          )}
                        >
                          {row.urgency}
                        </span>
                      </td>

                      {/* Status — inline select or read-only badge for terminal state */}
                      <td className={TD}>
                        <StatusCell
                          row={row}
                          onUpdate={handleStatusChange}
                          isUpdating={updateAdhoc.isPending}
                        />
                      </td>

                      {/* Assigned QA */}
                      <td className={TD}>
                        <span className="text-gray-500">
                          {row.assignedQa?.name ?? '—'}
                        </span>
                      </td>

                      {/* Converted */}
                      <td className={TD}>
                        {row.convertedToTc ? (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100">
                              <CheckIcon className="h-3 w-3 text-green-700" />
                            </span>
                            {row.convertedTcId && (
                              <span className="font-mono text-xs text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                                {row.convertedTcId}
                              </span>
                            )}
                          </div>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleConvert(row)}
                            disabled={convertToTc.isPending}
                            isLoading={convertToTc.isPending}
                          >
                            Convert to TC
                          </Button>
                        )}
                      </td>

                      {/* Actions */}
                      <td className={`${TD} text-right`}>
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Convert to Defect — only when not already converted to TC and not RESOLVED */}
                          {!row.convertedToTc && row.status !== AdhocStatus.RESOLVED && (
                            <button
                              onClick={() => handleConvertToDefect(row)}
                              disabled={convertToDefect.isPending}
                              className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              aria-label={`Convert ad-hoc case ${row.adhocId} to defect`}
                              title="Convert to Defect"
                            >
                              <BugAntIcon className="h-4 w-4" />
                            </button>
                          )}

                          <button
                            onClick={() => handleDelete(row)}
                            disabled={deleteAdhoc.isPending}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label={`Delete ad-hoc case ${row.adhocId}`}
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
        )}
      </div>

      <CreateAdhocModal
        projectId={projectId}
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
}
