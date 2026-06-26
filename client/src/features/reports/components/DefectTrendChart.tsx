'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Spinner } from '@/shared/components/ui/Spinner';
import { useDefectTrend } from '@/features/reports/hooks/useReports';

interface DefectTrendChartProps {
  projectId: string;
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

export function DefectTrendChart({ projectId }: DefectTrendChartProps) {
  const { data: trend, isLoading } = useDefectTrend(projectId);

  return (
    <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] p-6">
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-gray-900">Defect Trend</h2>
        <p className="text-xs text-gray-500 mt-0.5">Open vs closed defects over the last 30 days</p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {!isLoading && (!trend || trend.length === 0) && (
        <div className="flex items-center justify-center py-12 text-sm text-gray-400">
          No defect trend data available yet.
        </div>
      )}

      {!isLoading && trend && trend.length > 0 && (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart
            data={trend.map((entry) => ({
              ...entry,
              label: formatShortDate(entry.date),
            }))}
            margin={{ top: 4, right: 8, left: -10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '12px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }} />
            <Line
              type="monotone"
              dataKey="open"
              name="Open"
              stroke="#f87171"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="closed"
              name="Closed"
              stroke="#4ade80"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
