'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { Spinner } from '@/shared/components/ui/Spinner';
import { Badge } from '@/shared/components/ui/Badge';
import { useTraceability } from '../hooks/useRequirements';
import type { TraceabilityRow } from '../hooks/useRequirements';
import { ResultStatus, Priority } from '@/shared/types';

interface TraceabilityMatrixProps {
  projectId: string;
}

const ROW_STATUS_CONFIG = {
  GREEN: {
    icon: <CheckCircleIcon className="h-4 w-4 text-green-500 shrink-0" />,
    row: 'bg-green-50/30',
    badge: 'bg-green-100 text-green-700',
    label: 'Passing',
  },
  YELLOW: {
    icon: <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500 shrink-0" />,
    row: 'bg-yellow-50/30',
    badge: 'bg-yellow-100 text-yellow-700',
    label: 'Partial',
  },
  RED: {
    icon: <XCircleIcon className="h-4 w-4 text-red-500 shrink-0" />,
    row: 'bg-red-50/30',
    badge: 'bg-red-100 text-red-700',
    label: 'At Risk',
  },
};

const EXEC_STATUS_DOT: Record<string, string> = {
  [ResultStatus.PASS]: 'bg-green-500',
  [ResultStatus.FAIL]: 'bg-red-500',
  [ResultStatus.BLOCKED]: 'bg-orange-500',
  [ResultStatus.SKIPPED]: 'bg-gray-400',
  [ResultStatus.PENDING]: 'bg-yellow-400',
};

function ExecStatusDot({ status }: { status: string | null }) {
  if (!status) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-400">
        <span className="h-2 w-2 rounded-full bg-gray-200 shrink-0" />
        Untested
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-600">
      <span className={`h-2 w-2 rounded-full shrink-0 ${EXEC_STATUS_DOT[status] ?? 'bg-gray-300'}`} />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

function SummaryBar({ row }: { row: TraceabilityRow }) {
  const { summary } = row;
  if (summary.total === 0) {
    return <span className="text-xs text-gray-400 italic">No test cases</span>;
  }
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {summary.pass > 0 && (
        <span className="text-xs font-medium text-green-700 bg-green-100 px-1.5 py-0.5 rounded">
          {summary.pass} pass
        </span>
      )}
      {summary.fail > 0 && (
        <span className="text-xs font-medium text-red-700 bg-red-100 px-1.5 py-0.5 rounded">
          {summary.fail} fail
        </span>
      )}
      {summary.blocked > 0 && (
        <span className="text-xs font-medium text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded">
          {summary.blocked} blocked
        </span>
      )}
      {summary.untested > 0 && (
        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
          {summary.untested} untested
        </span>
      )}
    </div>
  );
}

function RequirementRow({ row, projectId }: { row: TraceabilityRow; projectId: string }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = ROW_STATUS_CONFIG[row.rowStatus];

  return (
    <>
      {/* Main row */}
      <tr
        className={`border-b border-gray-100 cursor-pointer hover:brightness-95 transition-all ${cfg.row}`}
        onClick={() => setExpanded((e) => !e)}
      >
        {/* Expand toggle + status icon */}
        <td className="px-4 py-3 w-8">
          <div className="flex items-center gap-1.5">
            {row.testCases.length > 0 ? (
              expanded
                ? <ChevronDownIcon className="h-3.5 w-3.5 text-gray-400" />
                : <ChevronRightIcon className="h-3.5 w-3.5 text-gray-400" />
            ) : (
              <span className="h-3.5 w-3.5" />
            )}
            {cfg.icon}
          </div>
        </td>

        {/* Req ID */}
        <td className="px-4 py-3">
          <span className="font-mono text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
            {row.reqId}
          </span>
          {row.externalId && (
            <span className="ml-1.5 text-[11px] text-gray-400">{row.externalId}</span>
          )}
        </td>

        {/* Title */}
        <td className="px-4 py-3">
          <p className="text-sm font-medium text-gray-900 max-w-sm truncate">{row.title}</p>
        </td>

        {/* Priority */}
        <td className="px-4 py-3">
          <Badge variant={row.priority as Priority}>{row.priority}</Badge>
        </td>

        {/* Test Cases summary */}
        <td className="px-4 py-3">
          <SummaryBar row={row} />
        </td>

        {/* TC count */}
        <td className="px-4 py-3 text-center">
          <span className="text-sm font-semibold text-gray-700">{row.summary.total}</span>
        </td>

        {/* Open Defects */}
        <td className="px-4 py-3 text-center">
          {row.openDefects > 0 ? (
            <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
              {row.openDefects}
            </span>
          ) : (
            <span className="text-xs text-gray-400">—</span>
          )}
        </td>

        {/* Status */}
        <td className="px-4 py-3 text-center">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.badge}`}>
            {cfg.label}
          </span>
        </td>
      </tr>

      {/* Expanded test cases */}
      {expanded && row.testCases.length > 0 && (
        <tr className={`border-b border-gray-100 ${cfg.row}`}>
          <td colSpan={8} className="px-4 pb-3 pt-0">
            <div className="ml-8 bg-white rounded-lg ring-1 ring-gray-200 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-gray-500">Test Case</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-500">Title</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-500">Last Result</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-500">Open Defects</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {row.testCases.map((tc) => (
                    <tr key={tc.id} className="hover:bg-gray-50/60">
                      <td className="px-3 py-2">
                        <Link
                          href={`/projects/${projectId}/cases/${tc.id}`}
                          className="font-mono text-primary-600 hover:text-primary-700 font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {tc.caseId}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-gray-700 max-w-xs truncate">{tc.title}</td>
                      <td className="px-3 py-2">
                        <ExecStatusDot status={tc.lastExecutionStatus} />
                      </td>
                      <td className="px-3 py-2">
                        {tc.openDefects > 0 ? (
                          <span className="font-semibold text-red-600">{tc.openDefects} open</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function TraceabilityMatrix({ projectId }: TraceabilityMatrixProps) {
  const { data, isLoading, isError } = useTraceability(projectId);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'GREEN' | 'YELLOW' | 'RED'>('ALL');

  const filtered = (data?.rows ?? []).filter(
    (r) => statusFilter === 'ALL' || r.rowStatus === statusFilter,
  );

  return (
    <div>
      {/* Stats bar */}
      {data?.stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total', value: data.stats.total, color: 'text-gray-900' },
            { label: 'Passing', value: data.stats.green, color: 'text-green-600' },
            { label: 'Partial', value: data.stats.yellow, color: 'text-yellow-600' },
            { label: 'At Risk', value: data.stats.red, color: 'text-red-600' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] px-5 py-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 mb-5 w-fit">
        {(['ALL', 'GREEN', 'YELLOW', 'RED'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={[
              'px-3 py-1 text-xs font-medium rounded-md transition-colors min-w-[72px] text-center',
              statusFilter === s
                ? 'bg-white text-primary-600 shadow-sm ring-1 ring-gray-900/[0.06]'
                : 'text-gray-500 hover:text-gray-700',
            ].join(' ')}
          >
            {s === 'ALL' ? 'All' : s === 'GREEN' ? 'Passing' : s === 'YELLOW' ? 'Partial' : 'At Risk'}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner size="lg" className="text-primary-500" />
        </div>
      )}

      {isError && (
        <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] p-6 text-center text-sm text-red-600">
          Failed to load traceability data.
        </div>
      )}

      {!isLoading && !isError && (
        <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-500">
              {data?.rows.length === 0
                ? 'No requirements found. Create requirements and link test cases to see traceability.'
                : 'No requirements match the selected filter.'}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 w-8" />
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Req ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Requirement</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Execution</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">TCs</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Open Bugs</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <RequirementRow key={row.id} row={row} projectId={projectId} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <p className="mt-3 text-xs text-gray-400 text-center">
        Click a row to expand linked test cases · Results reflect the last execution of each test case
      </p>
    </div>
  );
}
