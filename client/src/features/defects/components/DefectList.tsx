'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PlusIcon, TrashIcon, MagnifyingGlassIcon, ArrowDownTrayIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { PageHeader } from '@/shared/components/PageHeader';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Spinner } from '@/shared/components/ui/Spinner';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { useDefects, useUpdateDefect, useDeleteDefect } from '@/features/defects/hooks/useDefects';
import { DefectStatus, Severity, Priority } from '@/shared/types';
import type { Defect } from '@/shared/types';
import { CreateDefectModal } from './CreateDefectModal';
import { EditDefectModal } from './EditDefectModal';
import { exportService } from '@/features/exports/exportService';
import { DEFECT_STATUS_LABELS, DEFECT_STATUS_TRANSITIONS } from '@/features/defects/constants';
import { formatDate } from '@/shared/utils/date';
import { TH, TD } from '@/shared/constants/table';

interface DefectListProps {
  projectId: string;
}

const STATUS_FILTER_TABS: Array<{ label: string; value: DefectStatus | 'ALL' }> = [
  { label: 'All', value: 'ALL' },
  { label: 'Open', value: DefectStatus.OPEN },
  { label: 'In Progress', value: DefectStatus.IN_PROGRESS },
  { label: 'Fixed', value: DefectStatus.FIXED },
  { label: 'Needs Retest', value: DefectStatus.RETEST },
  { label: 'Reopened', value: DefectStatus.REOPENED },
  { label: 'Verified', value: DefectStatus.VERIFIED },
  { label: 'Closed', value: DefectStatus.CLOSED },
];

interface StatusCellProps {
  defect: Defect;
  onUpdate: (id: string, status: DefectStatus) => void;
  isUpdating: boolean;
}

function StatusCell({ defect, onUpdate, isUpdating }: StatusCellProps) {
  const transitions = DEFECT_STATUS_TRANSITIONS[defect.status];

  // WONTFIX or no available transitions — show read-only badge
  if (transitions.length === 0) {
    return <Badge variant={defect.status}>{DEFECT_STATUS_LABELS[defect.status]}</Badge>;
  }

  return (
    <select
      value={defect.status}
      disabled={isUpdating}
      onChange={(e) => onUpdate(defect.id, e.target.value as DefectStatus)}
      className="text-xs rounded border border-gray-200 bg-white px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary-400 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <option value={defect.status}>{DEFECT_STATUS_LABELS[defect.status]}</option>
      {transitions.map((s) => (
        <option key={s} value={s}>{DEFECT_STATUS_LABELS[s]}</option>
      ))}
    </select>
  );
}

export function DefectList({ projectId }: DefectListProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Defect | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DefectStatus | 'ALL'>('ALL');
  const [isExporting, setIsExporting] = useState(false);

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      await exportService.downloadDefectsExcel(projectId);
    } catch {
      // silent — browser download handles errors visually
    } finally {
      setIsExporting(false);
    }
  };

  const { data, isLoading, isError } = useDefects(projectId);
  const updateDefect = useUpdateDefect(projectId);
  const deleteDefect = useDeleteDefect(projectId);

  const allDefects: Defect[] = data?.data ?? [];

  // Client-side filtering
  const filtered = allDefects.filter((d) => {
    const matchesSearch =
      search.trim() === '' ||
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      (d.module ?? '').toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (id: string, status: DefectStatus) => {
    updateDefect.mutate({ id, input: { status } });
  };

  const handleDelete = (defect: Defect) => {
    if (window.confirm(`Delete defect "${defect.title}"? This action cannot be undone.`)) {
      deleteDefect.mutate(defect.id);
    }
  };

  return (
    <div>
      <PageHeader
        title="Defect Log"
        description="Track and manage bugs found during testing"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="md"
              leftIcon={<ArrowDownTrayIcon className="h-4 w-4" />}
              onClick={handleExportExcel}
              isLoading={isExporting}
            >
              Export Excel
            </Button>
            <Button
              variant="primary"
              size="md"
              leftIcon={<PlusIcon className="h-4 w-4" />}
              onClick={() => setIsCreateOpen(true)}
            >
              Log Defect
            </Button>
          </div>
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
              placeholder="Search defects..."
              className="pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 w-56 transition-shadow"
            />
          </div>

          {/* Status filter tabs */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {STATUS_FILTER_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={[
                  'px-3 py-1 text-xs font-medium rounded-md transition-colors min-w-[72px] text-center',
                  statusFilter === tab.value
                    ? 'bg-white text-primary-600 shadow-sm ring-1 ring-gray-900/[0.06]'
                    : 'text-gray-500 hover:text-gray-700',
                ].join(' ')}
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
            Failed to load defects. Please try again.
          </div>
        )}

        {/* Table */}
        {!isLoading && !isError && (
          <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] overflow-hidden">
            {filtered.length === 0 ? (
              <EmptyState
                title={
                  allDefects.length === 0
                    ? 'No defects logged yet'
                    : 'No defects match your filters'
                }
                description={
                  allDefects.length === 0
                    ? 'Log your first defect to start tracking bugs.'
                    : 'Try adjusting the search or status filter.'
                }
                actionLabel={allDefects.length === 0 ? 'Log Defect' : undefined}
                onAction={allDefects.length === 0 ? () => setIsCreateOpen(true) : undefined}
              />
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50/80 border-b border-gray-100">
                  <tr>
                    <th className={TH}>ID</th>
                    <th className={TH}>Title</th>
                    <th className={TH}>Module</th>
                    <th className={TH}>Severity</th>
                    <th className={TH}>Priority</th>
                    <th className={TH}>Status</th>
                    <th className={TH}>Assigned To</th>
                    <th className={TH}>Created</th>
                    <th className={`${TH} text-right`}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((defect) => (
                    <tr
                      key={defect.id}
                      className="hover:bg-gray-50/60 transition-colors group"
                    >
                      {/* ID */}
                      <td className={TD}>
                        <span className="font-mono text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                          {defect.defectId}
                        </span>
                      </td>

                      {/* Title */}
                      <td className={TD}>
                        <Link
                          href={`/projects/${projectId}/defects/${defect.id}`}
                          className="font-medium text-gray-900 hover:text-primary-600 transition-colors max-w-xs truncate block"
                        >
                          {defect.title}
                        </Link>
                      </td>

                      {/* Module */}
                      <td className={TD}>
                        <span className="text-gray-500">{defect.module ?? '—'}</span>
                      </td>

                      {/* Severity */}
                      <td className={TD}>
                        <Badge variant={defect.severity}>{defect.severity}</Badge>
                      </td>

                      {/* Priority */}
                      <td className={TD}>
                        <Badge variant={defect.priority}>{defect.priority}</Badge>
                      </td>

                      {/* Status — inline select or read-only badge */}
                      <td className={TD}>
                        <StatusCell
                          defect={defect}
                          onUpdate={handleStatusChange}
                          isUpdating={updateDefect.isPending}
                        />
                      </td>

                      {/* Assigned To */}
                      <td className={TD}>
                        <span className="text-gray-500">
                          {defect.assignedTo?.name ?? '—'}
                        </span>
                      </td>

                      {/* Created */}
                      <td className={TD}>
                        <span className="text-gray-400 text-xs">{formatDate(defect.createdAt)}</span>
                      </td>

                      {/* Actions */}
                      <td className={`${TD} text-right`}>
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditTarget(defect)}
                            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                            aria-label={`Edit defect ${defect.defectId}`}
                            title="Edit"
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(defect)}
                            disabled={deleteDefect.isPending}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label={`Delete defect ${defect.defectId}`}
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

      <CreateDefectModal
        projectId={projectId}
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      {editTarget && (
        <EditDefectModal
          projectId={projectId}
          defect={editTarget}
          isOpen={!!editTarget}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  );
}
