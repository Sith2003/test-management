'use client';

import { useState } from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { Spinner } from '@/shared/components/ui/Spinner';
import { useReleaseReadiness } from '@/features/reports/hooks/useReports';
import type { ReleaseReadinessData, ReleaseReadinessMetric } from '@/features/reports/services/reportService';

interface ReleaseReadinessCardProps {
  projectId: string;
}

function metricStatus(value: number, target: number, lowerIsBetter: boolean): 'pass' | 'warn' | 'fail' {
  if (lowerIsBetter) {
    if (value === target) return 'pass';
    if (value <= target + 2) return 'warn';
    return 'fail';
  }
  if (value >= target) return 'pass';
  if (value >= target - 10) return 'warn';
  return 'fail';
}

const STATUS_ICON = {
  pass: <CheckCircleIcon className="h-4 w-4 text-green-500" />,
  warn: <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />,
  fail: <XCircleIcon className="h-4 w-4 text-red-500" />,
};

const STATUS_ROW = {
  pass: 'bg-green-50/50',
  warn: 'bg-yellow-50/50',
  fail: 'bg-red-50/50',
};

interface MetricRowProps {
  label: string;
  metric: ReleaseReadinessMetric;
  lowerIsBetter?: boolean;
  format?: (v: number) => string;
  detail?: string;
}

function MetricRow({ label, metric, lowerIsBetter = false, format, detail }: MetricRowProps) {
  const status = metricStatus(metric.value, metric.target, lowerIsBetter);
  const display = format ? format(metric.value) : String(metric.value);
  const targetDisplay = format ? format(metric.target) : String(metric.target);

  return (
    <tr className={`border-b border-gray-100 last:border-0 ${STATUS_ROW[status]}`}>
      <td className="px-4 py-3 text-sm font-medium text-gray-700">{label}</td>
      <td className="px-4 py-3 text-sm text-gray-500 text-center">
        {lowerIsBetter ? `≤ ${targetDisplay}` : `≥ ${targetDisplay}`}
      </td>
      <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-center">
        {display}
        {detail && <span className="ml-1 text-xs text-gray-400 font-normal">{detail}</span>}
      </td>
      <td className="px-4 py-3 text-center">
        {STATUS_ICON[status]}
      </td>
    </tr>
  );
}

const VERDICT_CONFIG = {
  GO: {
    icon: <CheckCircleIcon className="h-8 w-8 text-green-500" />,
    label: 'GO',
    desc: 'All quality gates passed. Safe to release.',
    bg: 'bg-green-50 border-green-200',
    text: 'text-green-700',
  },
  CONDITIONAL: {
    icon: <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />,
    label: 'CONDITIONAL',
    desc: 'Some metrics below target. Review before releasing.',
    bg: 'bg-yellow-50 border-yellow-200',
    text: 'text-yellow-700',
  },
  NO_GO: {
    icon: <XCircleIcon className="h-8 w-8 text-red-500" />,
    label: 'NO-GO',
    desc: 'Critical blockers detected. Not safe to release.',
    bg: 'bg-red-50 border-red-200',
    text: 'text-red-700',
  },
};

export function ReleaseReadinessCard({ projectId }: ReleaseReadinessCardProps) {
  const [sprint, setSprint] = useState<string>('');
  const [version, setVersion] = useState<string>('');

  const { data, isLoading, isError } = useReleaseReadiness(
    projectId,
    sprint || undefined,
    version || undefined,
  );

  return (
    <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Release Readiness</h2>
          <p className="text-xs text-gray-500 mt-0.5">Go / No-Go decision support</p>
        </div>
        <div className="flex items-center gap-2">
          <FilterSelect
            label="Sprint"
            value={sprint}
            options={data?.filters.sprints ?? []}
            onChange={setSprint}
          />
          <FilterSelect
            label="Version"
            value={version}
            options={data?.filters.versions ?? []}
            onChange={setVersion}
          />
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {isError && (
        <div className="p-6 text-sm text-red-600">Failed to load release readiness data.</div>
      )}

      {!isLoading && !isError && data && (
        <div className="p-6 space-y-5">
          {/* Verdict banner */}
          <VerdictBanner data={data} />

          {/* Metrics table */}
          <div className="rounded-lg overflow-hidden ring-1 ring-gray-900/[0.06]">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Metric</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Target</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actual</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                <MetricRow
                  label="Test Pass Rate"
                  metric={data.metrics.passRate}
                  format={(v) => `${v}%`}
                  detail={data.metrics.passRate.total ? `(${data.metrics.passRate.passed}/${data.metrics.passRate.total})` : undefined}
                />
                <MetricRow
                  label="Critical Bugs Open"
                  metric={data.metrics.criticalOpen}
                  lowerIsBetter
                />
                <MetricRow
                  label="High Bugs Open"
                  metric={data.metrics.highOpen}
                  lowerIsBetter
                />
                <MetricRow
                  label="Requirements Covered"
                  metric={data.metrics.reqCoverage}
                  format={(v) => `${v}%`}
                  detail={data.metrics.reqCoverage.total ? `(${data.metrics.reqCoverage.covered}/${data.metrics.reqCoverage.total})` : undefined}
                />
                <MetricRow
                  label="Untested Cases"
                  metric={data.metrics.untested}
                  lowerIsBetter
                  detail={data.metrics.untested.total ? `of ${data.metrics.untested.total} total` : undefined}
                />
              </tbody>
            </table>
          </div>

          {/* Footer summary */}
          {data.metrics.totalOpenDefects > 0 && (
            <p className="text-xs text-gray-500 text-center">
              {data.metrics.totalOpenDefects} open defect{data.metrics.totalOpenDefects !== 1 ? 's' : ''} total across all severities
              {sprint ? ` · Sprint: ${sprint}` : ''}
              {version ? ` · Version: ${version}` : ''}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function VerdictBanner({ data }: { data: ReleaseReadinessData }) {
  const cfg = VERDICT_CONFIG[data.verdict];
  return (
    <div className={`rounded-xl border px-5 py-4 flex items-center gap-4 ${cfg.bg}`}>
      {cfg.icon}
      <div>
        <p className={`text-lg font-bold tracking-wide ${cfg.text}`}>{cfg.label}</p>
        <p className={`text-sm ${cfg.text} opacity-80`}>{cfg.desc}</p>
      </div>
    </div>
  );
}

function FilterSelect({
  label, value, options, onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  if (options.length === 0) return null;
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-xs rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400"
    >
      <option value="">All {label}s</option>
      {options.map((o) => (
        <option key={o} value={o}>{label}: {o}</option>
      ))}
    </select>
  );
}
