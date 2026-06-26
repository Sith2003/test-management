'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Spinner } from '@/shared/components/ui/Spinner';
import { useRunHistory } from '@/features/reports/hooks/useReports';

interface RunHistoryChartProps {
  projectId: string;
}

export function RunHistoryChart({ projectId }: RunHistoryChartProps) {
  const { data: runs, isLoading } = useRunHistory(projectId);

  return (
    <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] p-6">
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-gray-900">Run History</h2>
        <p className="text-xs text-gray-500 mt-0.5">Results across the last 10 test runs</p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      )}

      {!isLoading && (!runs || runs.length === 0) && (
        <div className="flex items-center justify-center py-12 text-sm text-gray-400">
          No run history available yet.
        </div>
      )}

      {!isLoading && runs && runs.length > 0 && (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={runs.slice(-10).map((run) => ({
            name: run.runName.length > 14 ? `${run.runName.slice(0, 14)}…` : run.runName,
            Pass: run.pass,
            Fail: run.fail,
            Blocked: run.blocked,
            Skipped: run.skipped,
            Pending: run.pending,
          }))} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
              cursor={{ fill: 'rgb(249 250 251)' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }} />
            <Bar dataKey="Pass" fill="#4ade80" stackId="s" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Fail" fill="#f87171" stackId="s" />
            <Bar dataKey="Blocked" fill="#fb923c" stackId="s" />
            <Bar dataKey="Skipped" fill="#d1d5db" stackId="s" />
            <Bar dataKey="Pending" fill="#fcd34d" stackId="s" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
