'use client';

import { Spinner } from '@/shared/components/ui/Spinner';
import { useAutomationCoverage } from '@/features/reports/hooks/useReports';

interface AutomationCoverageChartProps {
  projectId: string;
}

interface CoverageBoxProps {
  label: string;
  count: number;
  percent: number;
  barColor: string;
  bgColor: string;
  textColor: string;
}

function CoverageBox({ label, count, percent, barColor, bgColor, textColor }: CoverageBoxProps) {
  return (
    <div className={`rounded-xl p-5 flex flex-col gap-3 ${bgColor}`}>
      <div className="flex items-center justify-between">
        <p className={`text-sm font-medium ${textColor}`}>{label}</p>
        <span className={`text-2xl font-bold ${textColor}`}>{count}</span>
      </div>
      <div>
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-gray-500">Coverage</span>
          <span className={`font-semibold ${textColor}`}>{percent.toFixed(1)}%</span>
        </div>
        <div className="h-2 bg-white/60 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function AutomationCoverageChart({ projectId }: AutomationCoverageChartProps) {
  const { data, isLoading } = useAutomationCoverage(projectId);

  return (
    <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] p-6">
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-gray-900">Automation Coverage</h2>
        <p className="text-xs text-gray-500 mt-0.5">Breakdown of test cases by automation status</p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {!isLoading && !data && (
        <div className="flex items-center justify-center py-12 text-sm text-gray-400">
          No automation coverage data available.
        </div>
      )}

      {!isLoading && data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <CoverageBox
              label="Manual"
              count={data.manual}
              percent={data.total > 0 ? (data.manual / data.total) * 100 : 0}
              barColor="bg-gray-500"
              bgColor="bg-gray-50"
              textColor="text-gray-700"
            />
            <CoverageBox
              label="Automated"
              count={data.automated}
              percent={data.total > 0 ? (data.automated / data.total) * 100 : 0}
              barColor="bg-emerald-500"
              bgColor="bg-emerald-50"
              textColor="text-emerald-700"
            />
            <CoverageBox
              label="In Progress"
              count={data.inProgress}
              percent={data.total > 0 ? (data.inProgress / data.total) * 100 : 0}
              barColor="bg-amber-500"
              bgColor="bg-amber-50"
              textColor="text-amber-700"
            />
          </div>
          <p className="mt-3 text-xs text-gray-400 text-right">
            Total test cases: {data.total}
          </p>
        </>
      )}
    </div>
  );
}
