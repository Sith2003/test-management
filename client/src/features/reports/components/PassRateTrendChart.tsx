'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Spinner } from '@/shared/components/ui/Spinner';
import { usePassRateTrend } from '@/features/reports/hooks/useReports';

interface PassRateTrendChartProps {
  projectId: string;
}

function shortName(name: string): string {
  return name.length > 14 ? `${name.slice(0, 14)}\u2026` : name;
}

function passRateColor(rate: number): string {
  if (rate >= 80) return '#4ade80';
  if (rate >= 50) return '#fbbf24';
  return '#f87171';
}

export function PassRateTrendChart({ projectId }: PassRateTrendChartProps) {
  const { data: trend, isLoading } = usePassRateTrend(projectId);

  return (
    <div className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] p-6">
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-gray-900">Pass Rate Trend</h2>
        <p className="text-xs text-gray-500 mt-0.5">Pass rate % per test run</p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {!isLoading && (!trend || trend.length === 0) && (
        <div className="flex items-center justify-center py-12 text-sm text-gray-400">
          No pass rate data available yet.
        </div>
      )}

      {!isLoading && trend && trend.length > 0 && (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart
            data={trend.map((entry) => ({
              name: shortName(entry.runName),
              passRate: parseFloat((entry.passRate * 100).toFixed(1)),
              total: entry.total,
            }))}
            margin={{ top: 4, right: 8, left: -10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '12px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
              }}
              formatter={(value: number, _name: string, props) => [
                `${value}% (${props.payload.total} cases)`,
                'Pass Rate',
              ]}
            />
            <ReferenceLine
              y={80}
              stroke="#d1d5db"
              strokeDasharray="4 4"
              label={{ value: '80%', position: 'insideTopRight', fontSize: 10, fill: '#9ca3af' }}
            />
            <Line
              type="monotone"
              dataKey="passRate"
              name="Pass Rate"
              stroke="#015C91"
              strokeWidth={2.5}
              dot={(props) => {
                const { cx, cy, payload } = props;
                return (
                  <circle
                    key={`dot-${payload.name}`}
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill={passRateColor(payload.passRate)}
                    stroke="white"
                    strokeWidth={1.5}
                  />
                );
              }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
