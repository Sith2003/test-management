'use client';

import { Spinner } from '@/shared/components/ui/Spinner';
import { useSuiteBreakdown } from '@/features/reports/hooks/useReports';

interface SuiteBreakdownProps {
  projectId: string;
}

const dot = (color: string) => (
  <span className={`inline-block w-2 h-2 rounded-full ${color}`} />
);

export function SuiteBreakdown({ projectId }: SuiteBreakdownProps) {
  const { data: suites, isLoading } = useSuiteBreakdown(projectId);

  return (
    <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900">Suite Breakdown</h2>
        <p className="text-xs text-gray-500 mt-0.5">Test execution results by suite</p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-10"><Spinner size="lg" /></div>
      )}

      {!isLoading && (!suites || suites.length === 0) && (
        <p className="text-sm text-gray-400 text-center py-10 px-6">No suites found for this project.</p>
      )}

      {!isLoading && suites && suites.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50/70">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Suite</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{dot('bg-green-400')} Pass</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{dot('bg-red-400')} Fail</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{dot('bg-orange-400')} Blocked</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{dot('bg-yellow-300')} Pending</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{dot('bg-gray-300')} Untested</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pass %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {suites.map((suite) => {
                const executed = suite.pass + suite.fail + suite.blocked;
                const passPct = executed > 0 ? Math.round((suite.pass / executed) * 100) : 0;
                return (
                  <tr key={suite.suiteId} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-3.5 text-sm font-medium text-gray-900">{suite.suiteName}</td>
                    <td className="px-6 py-3.5 text-sm text-gray-600 font-medium">{suite.totalCases}</td>
                    <td className="px-6 py-3.5 text-sm text-green-600 font-medium">{suite.pass}</td>
                    <td className="px-6 py-3.5 text-sm text-red-500 font-medium">{suite.fail}</td>
                    <td className="px-6 py-3.5 text-sm text-orange-500 font-medium">{suite.blocked}</td>
                    <td className="px-6 py-3.5 text-sm text-yellow-600 font-medium">{suite.pending}</td>
                    <td className="px-6 py-3.5 text-sm text-gray-400 font-medium">{suite.untested}</td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-20">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${passPct}%` }} />
                        </div>
                        <span className="text-xs text-gray-500 tabular-nums w-8">{passPct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
