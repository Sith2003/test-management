'use client';

import Link from 'next/link';
import { CalendarIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Badge } from '@/shared/components/ui/Badge';
import { Spinner } from '@/shared/components/ui/Spinner';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { usePlans, useDeletePlan } from '@/features/test-plans/hooks/usePlans';
import { PlanStatus } from '@/shared/types';

interface TestPlanListProps {
  projectId: string;
  onCreateClick: () => void;
}

const STATUS_LABELS: Record<PlanStatus, string> = {
  [PlanStatus.DRAFT]: 'Draft',
  [PlanStatus.ACTIVE]: 'Active',
  [PlanStatus.COMPLETED]: 'Completed',
  [PlanStatus.ARCHIVED]: 'Archived',
};

export function TestPlanList({ projectId, onCreateClick }: TestPlanListProps) {
  const { data: plans, isLoading } = usePlans(projectId);
  const deletePlan = useDeletePlan(projectId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!plans?.length) {
    return (
      <EmptyState
        title="No test plans yet"
        description="Create a test plan to organize your test runs by sprint or release."
        actionLabel="New Test Plan"
        onAction={onCreateClick}
      />
    );
  }

  return (
    <div className="space-y-3">
      {plans.map((plan) => {
        const progress = plan.progress;
        const completionPct =
          progress && progress.totalRuns > 0
            ? Math.round((progress.completedRuns / progress.totalRuns) * 100)
            : 0;

        const targetDate = plan.targetDate
          ? new Date(plan.targetDate).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : null;

        const isOverdue =
          plan.targetDate &&
          plan.status !== PlanStatus.COMPLETED &&
          plan.status !== PlanStatus.ARCHIVED &&
          new Date(plan.targetDate) < new Date();

        return (
          <div
            key={plan.id}
            className="bg-white rounded-xl ring-1 ring-gray-900/[0.06] px-5 py-4 flex items-start gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <Link
                  href={`/projects/${projectId}/plans/${plan.id}`}
                  className="text-sm font-semibold text-gray-900 hover:text-primary-600 transition-colors"
                >
                  {plan.name}
                </Link>
                <Badge variant={plan.status}>{STATUS_LABELS[plan.status]}</Badge>
                {plan.sprint && (
                  <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5 font-medium">
                    {plan.sprint}
                  </span>
                )}
                {plan.version && (
                  <span className="text-xs bg-primary-50 text-primary-700 border border-primary-200 rounded-full px-2 py-0.5 font-medium">
                    v{plan.version}
                  </span>
                )}
              </div>

              {plan.description && (
                <p className="text-xs text-gray-500 mb-3 line-clamp-1">{plan.description}</p>
              )}

              <div className="flex items-center gap-6 text-xs text-gray-500">
                {targetDate && (
                  <span
                    className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}
                  >
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {isOverdue ? 'Overdue · ' : ''}
                    {targetDate}
                  </span>
                )}
                <span>
                  {plan._count.testRuns} run{plan._count.testRuns !== 1 ? 's' : ''}
                </span>
                {plan.assignees.length > 0 && (
                  <span>
                    {plan.assignees.length} assignee{plan.assignees.length !== 1 ? 's' : ''}
                  </span>
                )}
                {progress && progress.totalRuns > 0 && (
                  <span className="text-green-700 font-medium">{progress.passRate}% pass rate</span>
                )}
              </div>

              {/* Progress bar */}
              {progress && progress.totalRuns > 0 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                    <span>
                      {progress.completedRuns} / {progress.totalRuns} runs completed
                    </span>
                    <span className="font-medium">{completionPct}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all"
                      style={{ width: `${completionPct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                if (confirm(`Delete plan "${plan.name}"?`)) {
                  deletePlan.mutate(plan.id);
                }
              }}
              disabled={deletePlan.isPending}
              className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
