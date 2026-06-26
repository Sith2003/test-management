'use client';

import { Spinner } from '@/shared/components/ui/Spinner';
import { useRequirementCoverage } from '@/features/reports/hooks/useReports';

interface RequirementCoverageCardProps {
  projectId: string;
}

export function RequirementCoverageCard({ projectId }: RequirementCoverageCardProps) {
  const { data, isLoading } = useRequirementCoverage(projectId);

  const pct = data?.coveragePercent ?? 0;

  const barColor =
    pct >= 80
      ? 'bg-emerald-500'
      : pct >= 50
      ? 'bg-amber-500'
      : 'bg-red-500';

  return (
    <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] p-6">
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-gray-900">Requirement Coverage</h2>
        <p className="text-xs text-gray-500 mt-0.5">How many requirements are covered by test cases</p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      )}

      {!isLoading && !data && (
        <div className="flex items-center justify-center py-8 text-sm text-gray-400">
          No requirement coverage data available.
        </div>
      )}

      {!isLoading && data && (
        <div className="space-y-5">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-gray-900">{data.totalRequirements}</p>
              <p className="text-xs text-gray-500 mt-1">Total Requirements</p>
            </div>
            <div className="text-center p-4 bg-primary-50 rounded-xl">
              <p className="text-2xl font-bold text-primary-700">{data.coveredRequirements}</p>
              <p className="text-xs text-primary-500 mt-1">Covered</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-2xl font-bold text-gray-700">
                {data.totalRequirements - data.coveredRequirements}
              </p>
              <p className="text-xs text-gray-500 mt-1">Not Covered</p>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600 font-medium">Coverage</span>
              <span className="font-bold text-gray-900 tabular-nums">{pct.toFixed(1)}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
