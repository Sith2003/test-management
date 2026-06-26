'use client';

import Link from 'next/link';
import { BugAntIcon } from '@heroicons/react/24/outline';
import { Badge } from '@/shared/components/ui/Badge';
import { Spinner } from '@/shared/components/ui/Spinner';
import { useDefectsByTestCase } from '../hooks/useDefects';
import { DefectStatus } from '@/shared/types';

interface DefectHistorySectionProps {
  projectId: string;
  testCaseId: string;
}

const STATUS_LABELS: Record<DefectStatus, string> = {
  [DefectStatus.OPEN]:        'Open',
  [DefectStatus.IN_PROGRESS]: 'In Progress',
  [DefectStatus.FIXED]:       'Fixed',
  [DefectStatus.RETEST]:      'Needs Retest',
  [DefectStatus.VERIFIED]:    'Verified',
  [DefectStatus.REOPENED]:    'Reopened',
  [DefectStatus.CLOSED]:      'Closed',
  [DefectStatus.WONTFIX]:     "Won't Fix",
};

const ACTIVE_STATUSES: DefectStatus[] = [
  DefectStatus.OPEN,
  DefectStatus.IN_PROGRESS,
  DefectStatus.RETEST,
  DefectStatus.REOPENED,
];

export function DefectHistorySection({ projectId, testCaseId }: DefectHistorySectionProps) {
  const { data, isLoading } = useDefectsByTestCase(projectId, testCaseId);
  const defects = data?.data ?? [];

  const open = defects.filter((d) => ACTIVE_STATUSES.includes(d.status as DefectStatus));
  const closed = defects.filter((d) => !ACTIVE_STATUSES.includes(d.status as DefectStatus));

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Defect History</h3>
        <div className="flex justify-center py-4"><Spinner size="sm" /></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <BugAntIcon className="h-4 w-4 text-gray-400" />
          Defect History
        </h3>
        <div className="flex items-center gap-2">
          {open.length > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
              {open.length} open
            </span>
          )}
          {defects.length > 0 && (
            <span className="text-xs text-gray-400">{defects.length} total</span>
          )}
        </div>
      </div>

      {defects.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No defects linked to this test case.</p>
      ) : (
        <div className="space-y-2">
          {defects.map((defect) => (
            <Link
              key={defect.id}
              href={`/projects/${projectId}/defects/${defect.id}`}
              className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2.5 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono text-[11px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded shrink-0">
                  {defect.defectId}
                </span>
                <span className="text-sm text-gray-700 truncate group-hover:text-primary-600 transition-colors">
                  {defect.title}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                <Badge variant={defect.severity}>{defect.severity}</Badge>
                <Badge variant={defect.status as DefectStatus}>
                  {STATUS_LABELS[defect.status as DefectStatus] ?? defect.status}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      )}

      {closed.length > 0 && open.length > 0 && (
        <p className="text-xs text-gray-400 mt-3 text-center">
          {closed.length} resolved · {open.length} still open
        </p>
      )}
    </div>
  );
}
