'use client';

import { useState } from 'react';
import { PrinterIcon } from '@heroicons/react/24/outline';
import { Spinner } from '@/shared/components/ui/Spinner';
import { useSprintSummary } from '@/features/reports/hooks/useReports';

interface SprintSummaryReportProps {
  projectId: string;
}

export function SprintSummaryReport({ projectId }: SprintSummaryReportProps) {
  const [sprint, setSprint] = useState<string>('');
  const [version, setVersion] = useState<string>('');

  const { data, isLoading } = useSprintSummary(
    projectId,
    sprint || undefined,
    version || undefined,
  );

  const filters = data?.filters ?? { sprints: [], versions: [] };
  const summary = data?.summary ?? null;

  const passRate =
    summary && summary.testResults.total > 0
      ? Math.round((summary.testResults.pass / summary.testResults.total) * 100)
      : 0;

  const reqPct =
    summary && summary.requirements.total > 0
      ? Math.round((summary.requirements.tested / summary.requirements.total) * 100)
      : 0;

  const hasFilter = !!(sprint || version);

  return (
    <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Sprint / Version Summary</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Select a sprint or version to see the summary
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sprint selector */}
          {filters.sprints.length > 0 && (
            <select
              value={sprint}
              onChange={(e) => { setSprint(e.target.value); setVersion(''); }}
              className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400"
            >
              <option value="">All Sprints</option>
              {filters.sprints.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}

          {/* Version selector */}
          {filters.versions.length > 0 && (
            <select
              value={version}
              onChange={(e) => { setVersion(e.target.value); setSprint(''); }}
              className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400"
            >
              <option value="">All Versions</option>
              {filters.versions.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          )}

          {/* Print */}
          {hasFilter && summary && (
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <PrinterIcon className="h-3.5 w-3.5" />
              Export PDF
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-10">
          <Spinner size="md" />
        </div>
      )}

      {/* No filter selected */}
      {!isLoading && !hasFilter && (
        <div className="text-center py-10 text-sm text-gray-400">
          {filters.sprints.length === 0 && filters.versions.length === 0
            ? 'No sprint or version data found. Tag a test run with a sprint or version first.'
            : 'Select a sprint or version above to generate the summary.'}
        </div>
      )}

      {/* Summary content */}
      {!isLoading && hasFilter && summary && (
        <div className="space-y-6" id="sprint-summary-print">
          {/* Title */}
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-base font-semibold text-gray-900">
              {sprint ? `Sprint: ${sprint}` : ''}{sprint && version ? ' · ' : ''}{version ? `Version: ${version}` : ''}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">{summary.totalRuns} test run{summary.totalRuns !== 1 ? 's' : ''} included</p>
          </div>

          {/* Test Execution */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Test Execution</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              <StatCard label="Total" value={summary.testResults.total} color="text-gray-900" />
              <StatCard
                label="Pass"
                value={summary.testResults.pass}
                sub={`${passRate}%`}
                color="text-green-700"
                bg="bg-green-50"
              />
              <StatCard
                label="Fail"
                value={summary.testResults.fail}
                color="text-red-700"
                bg="bg-red-50"
              />
              <StatCard
                label="Blocked"
                value={summary.testResults.blocked}
                color="text-orange-700"
                bg="bg-orange-50"
              />
              <StatCard
                label="Skipped"
                value={summary.testResults.skipped}
                color="text-gray-500"
              />
              <StatCard
                label="Pending"
                value={summary.testResults.pending}
                color="text-yellow-700"
                bg="bg-yellow-50"
              />
            </div>

            {/* Pass rate bar */}
            {summary.testResults.total > 0 && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Pass Rate</span>
                  <span className="font-medium tabular-nums">{passRate}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
                  {summary.testResults.pass > 0 && (
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${(summary.testResults.pass / summary.testResults.total) * 100}%` }}
                    />
                  )}
                  {summary.testResults.fail > 0 && (
                    <div
                      className="h-full bg-red-500 transition-all"
                      style={{ width: `${(summary.testResults.fail / summary.testResults.total) * 100}%` }}
                    />
                  )}
                  {summary.testResults.blocked > 0 && (
                    <div
                      className="h-full bg-orange-400 transition-all"
                      style={{ width: `${(summary.testResults.blocked / summary.testResults.total) * 100}%` }}
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bug Analysis */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Bug Analysis</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div className="rounded-lg border border-gray-100 px-4 py-3">
                <p className="text-xs text-gray-500 mb-1">New Bugs Found</p>
                <p className="text-2xl font-bold text-gray-900">{summary.bugsFound.total}</p>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                  {summary.bugsFound.critical > 0 && (
                    <span className="text-xs text-red-700 font-medium">
                      {summary.bugsFound.critical} Critical
                    </span>
                  )}
                  {summary.bugsFound.high > 0 && (
                    <span className="text-xs text-orange-700 font-medium">
                      {summary.bugsFound.high} High
                    </span>
                  )}
                  {summary.bugsFound.medium > 0 && (
                    <span className="text-xs text-yellow-700 font-medium">
                      {summary.bugsFound.medium} Medium
                    </span>
                  )}
                  {summary.bugsFound.low > 0 && (
                    <span className="text-xs text-gray-500 font-medium">
                      {summary.bugsFound.low} Low
                    </span>
                  )}
                  {summary.bugsFound.total === 0 && (
                    <span className="text-xs text-gray-400">No bugs logged via test results</span>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-gray-100 px-4 py-3">
                <p className="text-xs text-gray-500 mb-1">Bugs Resolved</p>
                <p className="text-2xl font-bold text-green-700">{summary.bugsResolved}</p>
                <p className="text-xs text-gray-400 mt-2">Verified / Closed / Won't Fix</p>
              </div>

              <div className="rounded-lg border border-gray-100 px-4 py-3">
                <p className="text-xs text-gray-500 mb-1">Carried Over</p>
                <p className={`text-2xl font-bold ${summary.bugsCarriedOver > 0 ? 'text-red-700' : 'text-gray-400'}`}>
                  {summary.bugsCarriedOver}
                </p>
                <p className="text-xs text-gray-400 mt-2">Still open or in progress</p>
              </div>
            </div>
          </div>

          {/* Requirements Coverage */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Requirements Tested</h4>
            <div className="flex items-center gap-6">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.requirements.tested}
                  <span className="text-sm font-normal text-gray-400 ml-1">/ {summary.requirements.total}</span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{reqPct}% requirements covered</p>
              </div>
              {summary.requirements.total > 0 && (
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all"
                    style={{ width: `${reqPct}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* No data for selected filter */}
      {!isLoading && hasFilter && summary && summary.testResults.total === 0 && (
        <p className="text-xs text-gray-400 text-center mt-2">
          No test results found for this filter.
        </p>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
  bg,
}: {
  label: string;
  value: number;
  sub?: string;
  color?: string;
  bg?: string;
}) {
  return (
    <div className={`rounded-lg px-3 py-2.5 border border-gray-100 ${bg ?? ''}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-xl font-bold mt-0.5 ${color ?? 'text-gray-900'}`}>{value}</p>
      {sub && <p className={`text-xs font-medium ${color ?? 'text-gray-500'}`}>{sub}</p>}
    </div>
  );
}
